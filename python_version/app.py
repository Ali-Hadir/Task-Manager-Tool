#!/usr/bin/env python3
"""
TaskFlow: Minimalist Recurring Task Hub (Python Edition)
A zero-dependency standalone Python application with SQLite persistence and a modern web UI.
Run with: python3 app.py
"""

import http.server
import json
import math
import os
import sqlite3
import sys
import urllib.parse
from datetime import datetime, date, timedelta

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'taskflow.db')
PORT = 5000

# ---------------------------------------------------------------------------
# Database & Seeding
# ---------------------------------------------------------------------------

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            initials TEXT NOT NULL,
            color_bg TEXT NOT NULL,
            color_text TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            assignee_id TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT DEFAULT 'normal',
            recurrence_type TEXT NOT NULL,
            days_of_week TEXT,
            week_of_month INTEGER,
            created_at TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS completions (
            task_id TEXT NOT NULL,
            date TEXT NOT NULL,
            completed INTEGER NOT NULL,
            completed_at TEXT,
            completed_by TEXT,
            PRIMARY KEY (task_id, date)
        )
    ''')

    conn.commit()

    # Seed initial members if empty
    cursor.execute('SELECT COUNT(*) FROM members')
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)
        conn.commit()

    conn.close()

def seed_data(cursor):
    members = [
        ('member-1', 'Alex Chen', 'Operations Lead', 'AC', 'bg-indigo-50', 'text-indigo-700'),
        ('member-2', 'Sarah Jenkins', 'Client Success Manager', 'SJ', 'bg-rose-50', 'text-rose-700'),
        ('member-3', 'Elena Rostova', 'Finance & Compliance', 'ER', 'bg-emerald-50', 'text-emerald-700'),
        ('member-4', 'Marcus Vance', 'Systems & Infrastructure', 'MV', 'bg-amber-50', 'text-amber-700'),
    ]
    cursor.executemany(
        'INSERT INTO members (id, name, role, initials, color_bg, color_text) VALUES (?, ?, ?, ?, ?, ?)',
        members
    )

    tasks = [
        # 5 Everyday tasks
        ('task-1', 'Daily Standup & Operational Blocker Review', 'Sync with team leads on daily blockers and urgent escalations.', 'member-1', 'Operations', 'high', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-2', 'System Health & Server Heartbeat Verification', 'Monitor cloud node health, database connection latency, and API error rates.', 'member-4', 'Infrastructure', 'high', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-3', 'Customer Priority Support & Inbox Zero Check', 'Review critical pending customer tickets and clear incoming tier-1 inquiries.', 'member-2', 'Client Support', 'normal', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-4', 'Daily Cash Settlement & Ledger Balance Check', 'Verify payment gateway batches, match daily inflows, and flag discrepancies.', 'member-3', 'Finance', 'high', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-5', 'Warehouse Dispatch & Shipment Manifest Log', 'Verify order dispatch queues and cross-check tracking numbers with logistics partners.', 'member-1', 'Logistics', 'normal', 'daily', None, None, datetime.utcnow().isoformat()),

        # 5 Specific Weekday tasks
        ('task-6', 'Monday Sprint Kickoff & Milestone Allocation', 'Review weekly deliverables, assign sprint tasks, and align on weekly targets.', 'member-1', 'Operations', 'high', 'weekdays', json.dumps([1]), None, datetime.utcnow().isoformat()),
        ('task-7', 'Tuesday Vendor Invoices & Tax Receipts Audit', 'Review pending supplier invoices, approve purchase requisitions, and record tax receipts.', 'member-3', 'Finance', 'normal', 'weekdays', json.dumps([2]), None, datetime.utcnow().isoformat()),
        ('task-8', 'Wednesday Client SLA Compliance & Feedback Review', 'Audit ticket response times against customer SLAs and review client satisfaction survey scores.', 'member-2', 'Client Support', 'normal', 'weekdays', json.dumps([3]), None, datetime.utcnow().isoformat()),
        ('task-9', 'Thursday Infrastructure Backup & Security Patch Dry-Run', 'Run automated backup verification and test server snapshot restoration in staging.', 'member-4', 'Infrastructure', 'high', 'weekdays', json.dumps([4]), None, datetime.utcnow().isoformat()),
        ('task-10', 'Friday Team Weekly Retrospective & Goal Wrap-Up', 'Publish the weekly completion metrics, celebrate wins, and note areas of improvement.', 'member-1', 'Operations', 'normal', 'weekdays', json.dumps([5]), None, datetime.utcnow().isoformat()),

        # Week of Month tasks
        ('task-11', 'Week 1 Financial Close & Payroll Preparation', 'Consolidate month-start accounts, review timesheets, and prepare preliminary payroll runs.', 'member-3', 'Finance', 'high', 'month_week', json.dumps([1, 2]), 1, datetime.utcnow().isoformat()),
        ('task-12', 'Week 2 Hardware Asset Audit & Maintenance Check', 'Physical equipment verification, UPS battery testing, and cooling unit inspections.', 'member-4', 'Infrastructure', 'normal', 'month_week', json.dumps([2, 4]), 2, datetime.utcnow().isoformat()),
    ]

    cursor.executemany('''
        INSERT INTO tasks (id, title, description, assignee_id, category, priority, recurrence_type, days_of_week, week_of_month, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', tasks)

# ---------------------------------------------------------------------------
# Recurrence Evaluation Engine
# ---------------------------------------------------------------------------

def get_week_of_month(dt: date) -> int:
    """Calculate week of the month (1=Days 1-7, 2=Days 8-14, 3=Days 15-21, 4=Days 22-28, 5=Days 29+)"""
    return math.ceil(dt.day / 7)

def get_js_day_of_week(dt: date) -> int:
    """Convert Python weekday (0=Mon..6=Sun) to standard JS day index (0=Sun, 1=Mon, ..., 6=Sat)"""
    return (dt.weekday() + 1) % 7

def is_task_due_on_date(task_row, dt: date) -> bool:
    rec_type = task_row['recurrence_type']
    day_idx = get_js_day_of_week(dt)

    if rec_type == 'daily':
        return True

    if rec_type == 'weekdays':
        days = json.loads(task_row['days_of_week'] or '[]')
        return day_idx in days

    if rec_type == 'month_week':
        target_week = task_row['week_of_month'] or 1
        current_week = get_week_of_month(dt)
        if target_week != current_week:
            return False
        days = json.loads(task_row['days_of_week'] or '[]')
        if days:
            return day_idx in days
        return True

    return False

# ---------------------------------------------------------------------------
# Web Request Handler & API
# ---------------------------------------------------------------------------

class TaskFlowHandler(http.server.SimpleHTTPRequestHandler):
    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/' or path == '/index.html':
            self.serve_html()
            return

        conn = get_db()
        cursor = conn.cursor()

        if path == '/api/members':
            cursor.execute('SELECT * FROM members')
            members = [dict(row) for row in cursor.fetchall()]
            conn.close()
            self.send_json(members)
            return

        if path == '/api/tasks':
            cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC')
            tasks = []
            for row in cursor.fetchall():
                t = dict(row)
                t['days_of_week'] = json.loads(t['days_of_week'] or '[]')
                tasks.append(t)
            conn.close()
            self.send_json(tasks)
            return

        if path == '/api/due':
            date_str = query.get('date', [date.today().isoformat()])[0]
            member_id = query.get('member_id', ['all'])[0]
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                target_date = date.today()

            cursor.execute('SELECT * FROM tasks')
            all_tasks = cursor.fetchall()

            cursor.execute('SELECT task_id, completed, completed_at, completed_by FROM completions WHERE date = ?', (date_str,))
            comp_map = {row['task_id']: dict(row) for row in cursor.fetchall()}

            due_list = []
            for t_row in all_tasks:
                if member_id != 'all' and t_row['assignee_id'] != member_id:
                    continue
                if is_task_due_on_date(t_row, target_date):
                    task_dict = dict(t_row)
                    task_dict['days_of_week'] = json.loads(task_dict['days_of_week'] or '[]')
                    comp = comp_map.get(t_row['id'])
                    task_dict['completed'] = bool(comp['completed']) if comp else False
                    task_dict['completed_at'] = comp['completed_at'] if comp else None
                    due_list.append(task_dict)

            conn.close()
            self.send_json({'date': date_str, 'tasks': due_list})
            return

        if path == '/api/reports/weekly':
            date_str = query.get('date', [date.today().isoformat()])[0]
            try:
                base_dt = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                base_dt = date.today()

            # Monday of the week
            diff_to_monday = base_dt.weekday() # 0 = Monday
            monday = base_dt - timedelta(days=diff_to_monday)
            week_days = [monday + timedelta(days=i) for i in range(7)]

            cursor.execute('SELECT * FROM tasks')
            tasks = [dict(r) for r in cursor.fetchall()]
            for t in tasks:
                t['days_of_week'] = json.loads(t['days_of_week'] or '[]')

            cursor.execute('SELECT * FROM completions')
            completions = {(r['date'], r['task_id']): r['completed'] for r in cursor.fetchall()}

            week_summary = []
            total_due = 0
            total_done = 0

            for t in tasks:
                task_days = []
                for d in week_days:
                    d_str = d.isoformat()
                    is_due = is_task_due_on_date(t, d)
                    is_done = bool(completions.get((d_str, t['id']), 0))
                    if is_due:
                        total_due += 1
                        if is_done:
                            total_done += 1
                    task_days.append({
                        'date': d_str,
                        'is_due': is_due,
                        'is_done': is_done
                    })
                week_summary.append({
                    'task': t,
                    'days': task_days
                })

            conn.close()
            self.send_json({
                'start_date': monday.isoformat(),
                'end_date': (monday + timedelta(days=6)).isoformat(),
                'total_due': total_due,
                'total_completed': total_done,
                'percentage': round((total_done / total_due) * 100) if total_due > 0 else 0,
                'matrix': week_summary
            })
            return

        conn.close()
        self.send_error(404, 'Endpoint Not Found')

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(length)
        payload = json.loads(post_body.decode('utf-8')) if post_body else {}

        conn = get_db()
        cursor = conn.cursor()

        if path == '/api/complete':
            task_id = payload.get('task_id')
            date_str = payload.get('date')
            completed = 1 if payload.get('completed') else 0
            completed_at = datetime.utcnow().isoformat() if completed else None

            cursor.execute('''
                INSERT INTO completions (task_id, date, completed, completed_at, completed_by)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(task_id, date) DO UPDATE SET
                    completed=excluded.completed,
                    completed_at=excluded.completed_at
            ''', (task_id, date_str, completed, completed_at, payload.get('completed_by', 'user')))
            conn.commit()
            conn.close()
            self.send_json({'status': 'ok', 'completed': bool(completed)})
            return

        if path == '/api/tasks':
            new_id = f"task-{int(datetime.utcnow().timestamp()*1000)}"
            cursor.execute('''
                INSERT INTO tasks (id, title, description, assignee_id, category, priority, recurrence_type, days_of_week, week_of_month, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                new_id,
                payload.get('title', '').strip(),
                payload.get('description', '').strip(),
                payload.get('assignee_id'),
                payload.get('category', 'General'),
                payload.get('priority', 'normal'),
                payload.get('recurrence_type', 'daily'),
                json.dumps(payload.get('days_of_week', [])),
                payload.get('week_of_month'),
                datetime.utcnow().isoformat()
            ))
            conn.commit()
            conn.close()
            self.send_json({'status': 'created', 'id': new_id})
            return

        if path == '/api/reset':
            cursor.execute('DELETE FROM tasks')
            cursor.execute('DELETE FROM members')
            cursor.execute('DELETE FROM completions')
            seed_data(cursor)
            conn.commit()
            conn.close()
            self.send_json({'status': 'reset_complete'})
            return

        conn.close()
        self.send_error(404, 'Endpoint Not Found')

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/tasks/'):
            task_id = path.split('/')[-1]
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
            cursor.execute('DELETE FROM completions WHERE task_id = ?', (task_id,))
            conn.commit()
            conn.close()
            self.send_json({'status': 'deleted'})
            return
        self.send_error(404)

    def serve_html(self):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskFlow: Minimalist Recurring Task Hub (Python Edition)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'DM Sans', sans-serif; background-color: #f8fafc; color: #0f172a; }
    h1, h2, h3, h4, .font-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <!-- Top Navigation Bar -->
  <header class="sticky top-0 z-30 bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">✓</div>
        <span class="text-lg font-bold tracking-tight text-slate-900">TaskFlow <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Python Edition</span></span>
      </div>

      <nav class="flex items-center gap-1">
        <button onclick="setView('checklist')" id="tab-checklist" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-900">Daily Checklist</button>
        <button onclick="setView('reports')" id="tab-reports" class="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900">Weekly Report</button>
        <button onclick="setView('tasks')" id="tab-tasks" class="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900">Schedules</button>
      </nav>

      <div class="flex items-center gap-2">
        <button onclick="resetDemo()" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs" title="Reset Demo Data">↺ Reset</button>
        <button onclick="openNewTaskModal()" class="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm">+ Add Task</button>
      </div>
    </div>
  </header>

  <!-- Date Bar -->
  <div id="date-bar" class="bg-white border-b border-slate-200 py-3">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button onclick="shiftDate(-1)" class="px-2 py-1 text-slate-600 hover:text-slate-900 text-sm">◀</button>
          <button onclick="setToday()" class="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white rounded shadow-xs">Today</button>
          <button onclick="shiftDate(1)" class="px-2 py-1 text-slate-600 hover:text-slate-900 text-sm">▶</button>
        </div>
        <span id="date-display" class="font-bold text-slate-900 text-base"></span>
        <input type="date" id="date-picker" onchange="onDatePicked(this.value)" class="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50">
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500">Progress: <strong id="progress-text" class="text-slate-900 font-mono">0/0 (0%)</strong></span>
        <div class="w-28 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div id="progress-bar" class="h-full bg-emerald-600 rounded-full" style="width: 0%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main View Area -->
  <main class="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
    <!-- View 1: Daily Checklist -->
    <div id="view-checklist" class="space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1" id="member-tabs">
          <!-- Member filter tabs populated via JS -->
        </div>
      </div>

      <div id="checklist-container" class="space-y-2.5">
        <!-- Checklist items populated via JS -->
      </div>
    </div>

    <!-- View 2: Weekly Report -->
    <div id="view-reports" class="hidden space-y-6">
      <div class="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Weekly Verification Report</h2>
          <p id="report-range" class="text-xs text-slate-500 mt-0.5"></p>
        </div>
        <div class="text-right">
          <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Weekly Completion</span>
          <div id="report-pct" class="text-2xl font-extrabold font-mono text-slate-900">0%</div>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th class="py-3 px-4 w-72">Task</th>
              <th class="py-3 px-2 text-center">Mon</th>
              <th class="py-3 px-2 text-center">Tue</th>
              <th class="py-3 px-2 text-center">Wed</th>
              <th class="py-3 px-2 text-center">Thu</th>
              <th class="py-3 px-2 text-center">Fri</th>
              <th class="py-3 px-2 text-center">Sat</th>
              <th class="py-3 px-2 text-center">Sun</th>
            </tr>
          </thead>
          <tbody id="matrix-tbody" class="divide-y divide-slate-100"></tbody>
        </table>
      </div>
    </div>

    <!-- View 3: Task Schedules -->
    <div id="view-tasks" class="hidden space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900">Task Schedule Registry</h2>
        <span class="text-xs text-slate-500 font-mono" id="task-count">0 tasks</span>
      </div>
      <div id="all-tasks-list" class="space-y-2"></div>
    </div>
  </main>

  <!-- Add Task Modal -->
  <div id="task-modal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-900">New Recurring Task</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
          <input type="text" id="modal-title" placeholder="e.g. Tuesday Vendor Invoices" class="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
          <select id="modal-assignee" class="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"></select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Category</label>
          <input type="text" id="modal-category" value="Operations" class="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
          <select id="modal-type" onchange="onTypeChanged(this.value)" class="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
            <option value="daily">Everyday (Daily)</option>
            <option value="weekdays">Specific Days of Week</option>
            <option value="month_week">Week of Month</option>
          </select>
        </div>
        <div id="modal-days-box" class="hidden p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Select Weekdays:</label>
          <div class="grid grid-cols-7 gap-1">
            <button type="button" onclick="toggleModalDay(1)" id="day-btn-1" class="py-1 text-xs font-semibold rounded bg-white border border-slate-200">M</button>
            <button type="button" onclick="toggleModalDay(2)" id="day-btn-2" class="py-1 text-xs font-semibold rounded bg-white border border-slate-200">T</button>
            <button type="button" onclick="toggleModalDay(3)" id="day-btn-3" class="py-1 text-xs font-semibold rounded bg-white border border-slate-200">W</button>
            <button type="button" onclick="toggleModalDay(4)" id="day-btn-4" class="py-1 text-xs font-semibold rounded bg-white border border-slate-200">T</button>
            <button type="button" onclick="toggleModalDay(5)" id="day-btn-5" class="py-1 text-xs font-semibold rounded bg-white border border-slate-200">F</button>
            <button type="button" onclick="toggleModalDay(6)" id="day-btn-6" class="py-1 text-xs font-semibold rounded bg-white border border-slate-200">S</button>
            <button type="button" onclick="toggleModalDay(0)" id="day-btn-0" class="py-1 text-xs font-semibold rounded bg-white border border-slate-200">S</button>
          </div>
        </div>
        <div id="modal-week-box" class="hidden p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Which Week of Month?</label>
          <select id="modal-week-num" class="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white">
            <option value="1">Week 1 (Days 1–7)</option>
            <option value="2">Week 2 (Days 8–14)</option>
            <option value="3">Week 3 (Days 15–21)</option>
            <option value="4">Week 4 (Days 22–28)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button onclick="closeModal()" class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
        <button onclick="saveTask()" class="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg">Save Task</button>
      </div>
    </div>
  </div>

  <footer class="border-t border-slate-200 bg-white py-3 mt-auto text-center text-xs text-slate-400">
    TaskFlow Python Server · SQLite Local Persistence
  </footer>

  <script>
    let currentDate = new Date();
    let currentMember = 'all';
    let members = [];
    let modalDays = [1];

    function formatDate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    async function init() {
      const res = await fetch('/api/members');
      members = await res.json();
      renderMemberTabs();
      populateAssigneeDropdown();
      updateDateDisplay();
      loadChecklist();
    }

    function renderMemberTabs() {
      const tabs = document.getElementById('member-tabs');
      tabs.innerHTML = `
        <button onclick="selectMember('all')" class="px-3 py-1.5 text-xs font-semibold rounded-lg ${currentMember==='all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}">All Team</button>
      ` + members.map(m => `
        <button onclick="selectMember('${m.id}')" class="px-3 py-1.5 text-xs font-medium rounded-lg ${currentMember===m.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}">
          ${m.name}
        </button>
      `).join('');
    }

    function selectMember(id) {
      currentMember = id;
      renderMemberTabs();
      loadChecklist();
    }

    function updateDateDisplay() {
      const opts = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
      document.getElementById('date-display').innerText = currentDate.toLocaleDateString('en-US', opts);
      document.getElementById('date-picker').value = formatDate(currentDate);
    }

    function shiftDate(delta) {
      currentDate.setDate(currentDate.getDate() + delta);
      updateDateDisplay();
      loadChecklist();
    }

    function setToday() {
      currentDate = new Date();
      updateDateDisplay();
      loadChecklist();
    }

    function onDatePicked(val) {
      if (!val) return;
      const [y, m, d] = val.split('-').map(Number);
      currentDate = new Date(y, m - 1, d);
      updateDateDisplay();
      loadChecklist();
    }

    async function loadChecklist() {
      const dStr = formatDate(currentDate);
      const res = await fetch(`/api/due?date=${dStr}&member_id=${currentMember}`);
      const data = await res.json();
      const container = document.getElementById('checklist-container');

      const total = data.tasks.length;
      const completed = data.tasks.filter(t => t.completed).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      document.getElementById('progress-text').innerText = `${completed}/${total} (${pct}%)`;
      document.getElementById('progress-bar').style.width = `${pct}%`;

      if (total === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs">
            No recurring tasks scheduled for this day.
          </div>
        `;
        return;
      }

      container.innerHTML = data.tasks.map(t => `
        <div onclick="toggleTask('${t.id}', ${!t.completed})" class="p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-colors ${t.completed ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 hover:border-slate-300'}">
          <input type="checkbox" ${t.completed ? 'checked' : ''} class="mt-0.5 w-4 h-4 rounded text-emerald-600 cursor-pointer pointer-events-none">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold ${t.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-900'}">${t.title}</span>
              ${t.priority === 'high' && !t.completed ? '<span class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">High</span>' : ''}
            </div>
            ${t.description ? `<p class="text-xs text-slate-500 mt-0.5">${t.description}</p>` : ''}
            <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>${getMemberName(t.assignee_id)}</span>
              <span>·</span>
              <span>${t.category}</span>
              <span>·</span>
              <span class="font-mono text-slate-500">${t.recurrence_type}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    function getMemberName(id) {
      const m = members.find(x => x.id === id);
      return m ? m.name : 'Unassigned';
    }

    async function toggleTask(taskId, newStatus) {
      const dStr = formatDate(currentDate);
      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, date: dStr, completed: newStatus })
      });
      loadChecklist();
    }

    function setView(view) {
      document.getElementById('view-checklist').classList.toggle('hidden', view !== 'checklist');
      document.getElementById('view-reports').classList.toggle('hidden', view !== 'reports');
      document.getElementById('view-tasks').classList.toggle('hidden', view !== 'tasks');
      document.getElementById('date-bar').classList.toggle('hidden', view !== 'checklist');

      document.getElementById('tab-checklist').className = `px-3 py-1.5 text-xs font-semibold rounded-lg ${view === 'checklist' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`;
      document.getElementById('tab-reports').className = `px-3 py-1.5 text-xs font-semibold rounded-lg ${view === 'reports' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`;
      document.getElementById('tab-tasks').className = `px-3 py-1.5 text-xs font-semibold rounded-lg ${view === 'tasks' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`;

      if (view === 'reports') loadReports();
      if (view === 'tasks') loadAllTasks();
    }

    async function loadReports() {
      const dStr = formatDate(currentDate);
      const res = await fetch(`/api/reports/weekly?date=${dStr}`);
      const data = await res.json();

      document.getElementById('report-range').innerText = `${data.start_date} to ${data.end_date}`;
      document.getElementById('report-pct').innerText = `${data.percentage}%`;

      const tbody = document.getElementById('matrix-tbody');
      tbody.innerHTML = data.matrix.map(row => `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
          <td class="py-3 px-4 font-semibold text-slate-900">${row.task.title}</td>
          ${row.days.map(d => `
            <td class="py-3 px-2 text-center">
              ${!d.is_due ? '<span class="text-slate-300">-</span>' : d.is_done ? '<span class="text-emerald-600 font-bold">✓</span>' : '<span class="text-rose-400">✗</span>'}
            </td>
          `).join('')}
        </tr>
      `).join('');
    }

    async function loadAllTasks() {
      const res = await fetch('/api/tasks');
      const tasks = await res.json();
      document.getElementById('task-count').innerText = `${tasks.length} tasks registered`;
      const list = document.getElementById('all-tasks-list');
      list.innerHTML = tasks.map(t => `
        <div class="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div class="font-bold text-xs text-slate-900">${t.title}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">${getMemberName(t.assignee_id)} · ${t.category} · Frequency: <span class="font-mono">${t.recurrence_type}</span></div>
          </div>
          <button onclick="deleteTask('${t.id}')" class="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded">Delete</button>
        </div>
      `).join('');
    }

    async function deleteTask(id) {
      if (confirm('Delete this task?')) {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        loadAllTasks();
      }
    }

    function openNewTaskModal() {
      document.getElementById('task-modal').classList.remove('hidden');
    }
    function closeModal() {
      document.getElementById('task-modal').classList.add('hidden');
    }

    function populateAssigneeDropdown() {
      const select = document.getElementById('modal-assignee');
      select.innerHTML = members.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('');
    }

    function onTypeChanged(val) {
      document.getElementById('modal-days-box').classList.toggle('hidden', val !== 'weekdays' && val !== 'month_week');
      document.getElementById('modal-week-box').classList.toggle('hidden', val !== 'month_week');
    }

    function toggleModalDay(d) {
      if (modalDays.includes(d)) modalDays = modalDays.filter(x => x !== d);
      else modalDays.push(d);
      [0,1,2,3,4,5,6].forEach(idx => {
        const btn = document.getElementById(`day-btn-${idx}`);
        btn.className = `py-1 text-xs font-semibold rounded ${modalDays.includes(idx) ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`;
      });
    }

    async function saveTask() {
      const title = document.getElementById('modal-title').value;
      if (!title) return alert('Title is required');
      const assignee_id = document.getElementById('modal-assignee').value;
      const category = document.getElementById('modal-category').value;
      const type = document.getElementById('modal-type').value;
      const weekNum = parseInt(document.getElementById('modal-week-num').value);

      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          assignee_id,
          category,
          recurrence_type: type,
          days_of_week: modalDays,
          week_of_month: type === 'month_week' ? weekNum : null
        })
      });

      closeModal();
      loadChecklist();
      loadAllTasks();
    }

    async function resetDemo() {
      if (confirm('Reset to initial 10-task demo template?')) {
        await fetch('/api/reset', { method: 'POST' });
        loadChecklist();
      }
    }

    init();
  </script>
</body>
</html>"""
        body = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

# ---------------------------------------------------------------------------
# Server Launcher
# ---------------------------------------------------------------------------

def run_server():
    init_db()
    server_address = ('', PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, TaskFlowHandler)
    print("=" * 60)
    print(f"TaskFlow Python Edition running at http://localhost:{PORT}")
    print(f"SQLite Database: {DB_FILE}")
    print("Zero external dependencies required - standard library only.")
    print("Press Ctrl+C to stop.")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)

if __name__ == '__main__':
    run_server()
