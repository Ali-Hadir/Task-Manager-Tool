#!/usr/bin/env python3
"""
TaskFlow Desktop: Minimalist Recurring Task Hub
A 100% standalone native desktop GUI application built with Python standard library (Tkinter + SQLite).
Zero external dependencies. Runs directly on Windows, macOS, and Linux.
"""

import sys
import os
import sqlite3
import json
import math
from datetime import datetime, date, timedelta

# Try importing tkinter (standard library on desktop Python)
try:
    import tkinter as tk
    from tkinter import ttk, messagebox
except ImportError:
    print("Tkinter is required for this desktop GUI application.")
    print("On Windows/macOS, Tkinter is included by default with standard Python.")
    print("On Linux, install it via: sudo apt-get install python3-tk")
    sys.exit(1)

# Database file in same directory as the script/executable
APP_DIR = os.path.dirname(os.path.abspath(sys.argv[0]))
DB_FILE = os.path.join(APP_DIR, 'taskflow_desktop.db')

WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

# ---------------------------------------------------------------------------
# Database Management
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
            initials TEXT NOT NULL
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
            PRIMARY KEY (task_id, date)
        )
    ''')

    cursor.execute('SELECT COUNT(*) FROM members')
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)

    conn.commit()
    conn.close()

def seed_data(cursor):
    members = [
        ('member-1', 'Alex Chen', 'Operations Lead', 'AC'),
        ('member-2', 'Sarah Jenkins', 'Client Success Manager', 'SJ'),
        ('member-3', 'Elena Rostova', 'Finance & Compliance', 'ER'),
        ('member-4', 'Marcus Vance', 'Systems & Infrastructure', 'MV'),
    ]
    cursor.executemany('INSERT INTO members (id, name, role, initials) VALUES (?, ?, ?, ?)', members)

    tasks = [
        # 5 Everyday tasks
        ('task-1', 'Daily Standup & Operational Blocker Review', 'Sync with team leads on daily blockers and high-priority dispatches.', 'member-1', 'Operations', 'high', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-2', 'System Health & Server Heartbeat Verification', 'Monitor cloud node health, database connection latency, and API error rates.', 'member-4', 'Infrastructure', 'high', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-3', 'Customer Priority Support & Inbox Zero Check', 'Review critical pending customer tickets and clear incoming tier-1 inquiries.', 'member-2', 'Client Support', 'normal', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-4', 'Daily Cash Settlement & Ledger Balance Check', 'Verify payment gateway batches, match daily inflows, and flag discrepancies.', 'member-3', 'Finance', 'high', 'daily', None, None, datetime.utcnow().isoformat()),
        ('task-5', 'Warehouse Dispatch & Shipment Manifest Log', 'Verify order dispatch queues and cross-check tracking numbers with logistics partners.', 'member-1', 'Logistics', 'normal', 'daily', None, None, datetime.utcnow().isoformat()),

        # 5 Specific Weekdays tasks
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
# Recurrence Engine
# ---------------------------------------------------------------------------

def get_week_of_month(dt: date) -> int:
    return math.ceil(dt.day / 7)

def get_js_day_of_week(dt: date) -> int:
    # 0=Sunday, 1=Monday ... 6=Saturday
    return (dt.weekday() + 1) % 7

def is_task_due(task, dt: date) -> bool:
    rec_type = task['recurrence_type']
    day_idx = get_js_day_of_week(dt)

    if rec_type == 'daily':
        return True
    if rec_type == 'weekdays':
        days = json.loads(task['days_of_week'] or '[]')
        return day_idx in days
    if rec_type == 'month_week':
        if (task['week_of_month'] or 1) != get_week_of_month(dt):
            return False
        days = json.loads(task['days_of_week'] or '[]')
        if days:
            return day_idx in days
        return True
    return False

def get_recurrence_label(task) -> str:
    rtype = task['recurrence_type']
    if rtype == 'daily':
        return 'Daily (Every day)'
    if rtype == 'weekdays':
        days = json.loads(task['days_of_week'] or '[]')
        names = [WEEKDAY_SHORT[(d - 1) % 7] for d in sorted(days)]
        return f"Every {', '.join(names)}"
    if rtype == 'month_week':
        wk = task['week_of_month'] or 1
        days = json.loads(task['days_of_week'] or '[]')
        if days:
            names = [WEEKDAY_SHORT[(d - 1) % 7] for d in sorted(days)]
            return f"Week {wk} of Month · {', '.join(names)}"
        return f"Week {wk} of Month"
    return rtype

# ---------------------------------------------------------------------------
# Desktop Application UI
# ---------------------------------------------------------------------------

class TaskFlowApp:
    def __init__(self, root):
        self.root = root
        self.root.title("TaskFlow — Minimalist Recurring Task Hub")
        self.root.geometry("980x680")
        self.root.minsize(800, 500)

        self.current_date = date.today()
        self.selected_member_id = "all"
        self.members = []
        self.check_vars = {}

        self.configure_styles()
        self.build_ui()
        self.load_members()
        self.refresh_date_display()
        self.refresh_checklist()

    def configure_styles(self):
        self.style = ttk.Style()
        # Use clean default theme
        available_themes = self.style.theme_names()
        if 'clam' in available_themes:
            self.style.theme_use('clam')

        self.style.configure("TNotebook", background="#f1f5f9", tabmargins=[2, 5, 2, 0])
        self.style.configure("TNotebook.Tab", font=("Segoe UI", 10, "bold"), padding=[12, 6])
        self.style.configure("TButton", font=("Segoe UI", 9, "bold"), padding=4)
        self.style.configure("Primary.TButton", font=("Segoe UI", 9, "bold"), background="#0f172a", foreground="#ffffff")
        self.style.configure("Treeview.Heading", font=("Segoe UI", 9, "bold"))
        self.style.configure("Treeview", font=("Segoe UI", 9), rowheight=26)

    def build_ui(self):
        # 1. Top Bar Frame
        top_bar = tk.Frame(self.root, bg="#ffffff", height=50, bd=0, highlightthickness=1, highlightbackground="#e2e8f0")
        top_bar.pack(fill=tk.X, side=tk.TOP)

        brand_lbl = tk.Label(top_bar, text="✓ TaskFlow", font=("Segoe UI", 13, "bold"), bg="#ffffff", fg="#0f172a")
        brand_lbl.pack(side=tk.LEFT, padx=16, pady=10)

        subtitle_lbl = tk.Label(top_bar, text="Desktop Edition · Local SQLite", font=("Segoe UI", 9), bg="#ffffff", fg="#64748b")
        subtitle_lbl.pack(side=tk.LEFT, pady=10)

        reset_btn = tk.Button(top_bar, text="↺ Reset Demo", command=self.reset_demo, font=("Segoe UI", 8), bg="#f8fafc", fg="#475569", relief=tk.FLAT, bd=1)
        reset_btn.pack(side=tk.RIGHT, padx=12, pady=10)

        add_btn = tk.Button(top_bar, text="+ Add Recurring Task", command=self.open_add_task_dialog, font=("Segoe UI", 9, "bold"), bg="#0f172a", fg="#ffffff", activebackground="#1e293b", activeforeground="#ffffff", relief=tk.FLAT, padx=10, pady=4)
        add_btn.pack(side=tk.RIGHT, padx=4, pady=10)

        # 2. Date Navigation Bar
        self.date_bar = tk.Frame(self.root, bg="#f8fafc", height=44, bd=0, highlightthickness=1, highlightbackground="#e2e8f0")
        self.date_bar.pack(fill=tk.X, side=tk.TOP)

        date_ctrl_frame = tk.Frame(self.date_bar, bg="#f8fafc")
        date_ctrl_frame.pack(side=tk.LEFT, padx=16, pady=6)

        prev_btn = tk.Button(date_ctrl_frame, text="◀", command=lambda: self.shift_date(-1), font=("Segoe UI", 8, "bold"), bg="#ffffff", fg="#334155", relief=tk.SOLID, bd=1, padx=6)
        prev_btn.pack(side=tk.LEFT, padx=2)

        today_btn = tk.Button(date_ctrl_frame, text="Today", command=self.set_today, font=("Segoe UI", 8, "bold"), bg="#ffffff", fg="#0f172a", relief=tk.SOLID, bd=1, padx=8)
        today_btn.pack(side=tk.LEFT, padx=2)

        next_btn = tk.Button(date_ctrl_frame, text="▶", command=lambda: self.shift_date(1), font=("Segoe UI", 8, "bold"), bg="#ffffff", fg="#334155", relief=tk.SOLID, bd=1, padx=6)
        next_btn.pack(side=tk.LEFT, padx=2)

        self.date_label = tk.Label(date_ctrl_frame, text="", font=("Segoe UI", 11, "bold"), bg="#f8fafc", fg="#0f172a")
        self.date_label.pack(side=tk.LEFT, padx=12)

        # Right side progress
        progress_frame = tk.Frame(self.date_bar, bg="#f8fafc")
        progress_frame.pack(side=tk.RIGHT, padx=16, pady=6)

        self.progress_label = tk.Label(progress_frame, text="Progress: 0/0 (0%)", font=("Segoe UI", 9, "bold"), bg="#f8fafc", fg="#0f172a")
        self.progress_label.pack(side=tk.LEFT, padx=8)

        self.mark_all_btn = tk.Button(progress_frame, text="Check All", command=self.toggle_all_today, font=("Segoe UI", 8), bg="#ffffff", fg="#047857", relief=tk.SOLID, bd=1, padx=6)
        self.mark_all_btn.pack(side=tk.LEFT)

        # 3. Notebook / Tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=16, pady=10)

        self.tab_checklist = tk.Frame(self.notebook, bg="#f8fafc")
        self.tab_reports = tk.Frame(self.notebook, bg="#f8fafc")
        self.tab_manage = tk.Frame(self.notebook, bg="#f8fafc")

        self.notebook.add(self.tab_checklist, text="  Daily Checklist  ")
        self.notebook.add(self.tab_reports, text="  Weekly Report  ")
        self.notebook.add(self.tab_manage, text="  Task Schedules  ")

        self.build_checklist_tab()
        self.build_reports_tab()
        self.build_manage_tab()

        self.notebook.bind("<<NotebookTabChanged>>", self.on_tab_changed)

    # ---------------- Checklist Tab ----------------
    def build_checklist_tab(self):
        # Filter Bar
        filter_frame = tk.Frame(self.tab_checklist, bg="#f8fafc")
        filter_frame.pack(fill=tk.X, pady=(6, 8))

        lbl = tk.Label(filter_frame, text="Filter by Member:", font=("Segoe UI", 9, "bold"), bg="#f8fafc", fg="#475569")
        lbl.pack(side=tk.LEFT, padx=(4, 6))

        self.member_combo = ttk.Combobox(filter_frame, state="readonly", width=25, font=("Segoe UI", 9))
        self.member_combo.pack(side=tk.LEFT)
        self.member_combo.bind("<<ComboboxSelected>>", self.on_member_filter_changed)

        # Canvas with scrollbar for checklist
        container = tk.Frame(self.tab_checklist, bg="#ffffff", bd=1, relief=tk.SOLID)
        container.pack(fill=tk.BOTH, expand=True, pady=4)

        self.canvas = tk.Canvas(container, bg="#ffffff", highlightthickness=0)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=self.canvas.yview)
        self.scroll_frame = tk.Frame(self.canvas, bg="#ffffff")

        self.scroll_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        self.canvas.create_window((0, 0), window=self.scroll_frame, anchor="nw")
        self.canvas.configure(xscrollcommand=None, yscrollcommand=scrollbar.set)

        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def refresh_checklist(self):
        for widget in self.scroll_frame.winfo_children():
            widget.destroy()
        self.check_vars.clear()

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tasks')
        all_tasks = cursor.fetchall()

        d_str = self.current_date.isoformat()
        cursor.execute('SELECT task_id, completed, completed_at FROM completions WHERE date = ?', (d_str,))
        comp_map = {row['task_id']: dict(row) for row in cursor.fetchall()}

        member_map = {m['id']: m['name'] for m in self.members}

        due_tasks = []
        for t in all_tasks:
            if self.selected_member_id != 'all' and t['assignee_id'] != self.selected_member_id:
                continue
            if is_task_due(t, self.current_date):
                due_tasks.append(t)

        conn.close()

        total = len(due_tasks)
        completed_count = sum(1 for t in due_tasks if comp_map.get(t['id'], {}).get('completed'))
        pct = round((completed_count / total) * 100) if total > 0 else 0

        self.progress_label.config(text=f"Due Today: {completed_count}/{total} ({pct}%)")
        self.mark_all_btn.config(text="Clear All" if total > 0 and completed_count == total else "Check All")

        if total == 0:
            empty_lbl = tk.Label(
                self.scroll_frame,
                text=f"No tasks scheduled for {self.current_date.strftime('%A, %b %d')}.\nRecurrence rules ensure tasks only appear on their due days.",
                font=("Segoe UI", 10),
                bg="#ffffff",
                fg="#64748b",
                pady=40
            )
            empty_lbl.pack(fill=tk.X, expand=True)
            return

        for t in due_tasks:
            is_comp = bool(comp_map.get(t['id'], {}).get('completed'))
            comp_time = comp_map.get(t['id'], {}).get('completed_at')

            card = tk.Frame(self.scroll_frame, bg="#f8fafc" if is_comp else "#ffffff", bd=1, relief=tk.SOLID, padx=12, pady=10)
            card.pack(fill=tk.X, expand=True, padx=10, pady=4)

            var = tk.BooleanVar(value=is_comp)
            self.check_vars[t['id']] = var

            chk = tk.Checkbutton(
                card,
                variable=var,
                command=lambda task_id=t['id'], v=var: self.on_task_check_toggle(task_id, v),
                bg="#f8fafc" if is_comp else "#ffffff",
                activebackground="#f8fafc" if is_comp else "#ffffff",
                font=("Segoe UI", 10)
            )
            chk.pack(side=tk.LEFT, anchor="n", padx=(0, 8))

            text_frame = tk.Frame(card, bg="#f8fafc" if is_comp else "#ffffff")
            text_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

            title_font = ("Segoe UI", 10, "overstrike" if is_comp else "bold")
            title_fg = "#94a3b8" if is_comp else "#0f172a"
            title_lbl = tk.Label(text_frame, text=t['title'], font=title_font, fg=title_fg, bg=text_frame['bg'])
            title_lbl.pack(anchor="w")

            if t['description']:
                desc_fg = "#94a3b8" if is_comp else "#475569"
                desc_lbl = tk.Label(text_frame, text=t['description'], font=("Segoe UI", 8), fg=desc_fg, bg=text_frame['bg'], wraplength=700, justify=tk.LEFT)
                desc_lbl.pack(anchor="w", pady=(2, 0))

            meta_text = f"{member_map.get(t['assignee_id'], 'Team')}  ·  {t['category']}  ·  {get_recurrence_label(t)}"
            if is_comp and comp_time:
                try:
                    dt_obj = datetime.fromisoformat(comp_time)
                    meta_text += f"  ·  Done at {dt_obj.strftime('%I:%M %p')}"
                except Exception:
                    pass

            meta_lbl = tk.Label(text_frame, text=meta_text, font=("Segoe UI", 8), fg="#64748b", bg=text_frame['bg'])
            meta_lbl.pack(anchor="w", pady=(4, 0))

    def on_task_check_toggle(self, task_id, var):
        is_completed = var.get()
        d_str = self.current_date.isoformat()
        comp_time = datetime.utcnow().isoformat() if is_completed else None

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO completions (task_id, date, completed, completed_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(task_id, date) DO UPDATE SET
                completed=excluded.completed,
                completed_at=excluded.completed_at
        ''', (task_id, d_str, 1 if is_completed else 0, comp_time))
        conn.commit()
        conn.close()

        self.refresh_checklist()

    def toggle_all_today(self):
        d_str = self.current_date.isoformat()
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tasks')
        tasks = cursor.fetchall()
        due_tasks = [t for t in tasks if is_task_due(t, self.current_date)]

        cursor.execute('SELECT task_id, completed FROM completions WHERE date = ?', (d_str,))
        comp_map = {r['task_id']: r['completed'] for r in cursor.fetchall()}

        all_completed = len(due_tasks) > 0 and all(comp_map.get(t['id'], 0) for t in due_tasks)
        new_state = 0 if all_completed else 1
        comp_time = datetime.utcnow().isoformat() if new_state else None

        for t in due_tasks:
            cursor.execute('''
                INSERT INTO completions (task_id, date, completed, completed_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(task_id, date) DO UPDATE SET
                    completed=excluded.completed,
                    completed_at=excluded.completed_at
            ''', (t['id'], d_str, new_state, comp_time))

        conn.commit()
        conn.close()
        self.refresh_checklist()

    # ---------------- Reports Tab ----------------
    def build_reports_tab(self):
        ctrl_frame = tk.Frame(self.tab_reports, bg="#f8fafc")
        ctrl_frame.pack(fill=tk.X, pady=(6, 8))

        self.report_range_lbl = tk.Label(ctrl_frame, text="", font=("Segoe UI", 10, "bold"), bg="#f8fafc", fg="#0f172a")
        self.report_range_lbl.pack(side=tk.LEFT)

        self.report_summary_lbl = tk.Label(ctrl_frame, text="", font=("Segoe UI", 10, "bold"), bg="#f8fafc", fg="#047857")
        self.report_summary_lbl.pack(side=tk.RIGHT)

        # 7-day matrix treeview
        columns = ("task", "mon", "tue", "wed", "thu", "fri", "sat", "sun", "rate")
        self.matrix_tree = ttk.Treeview(self.tab_reports, columns=columns, show="headings", height=16)

        self.matrix_tree.heading("task", text="Task Name / Assignee")
        self.matrix_tree.heading("mon", text="Mon")
        self.matrix_tree.heading("tue", text="Tue")
        self.matrix_tree.heading("wed", text="Wed")
        self.matrix_tree.heading("thu", text="Thu")
        self.matrix_tree.heading("fri", text="Fri")
        self.matrix_tree.heading("sat", text="Sat")
        self.matrix_tree.heading("sun", text="Sun")
        self.matrix_tree.heading("rate", text="Compliance")

        self.matrix_tree.column("task", width=340)
        for col in ("mon", "tue", "wed", "thu", "fri", "sat", "sun"):
            self.matrix_tree.column(col, width=55, anchor="center")
        self.matrix_tree.column("rate", width=90, anchor="e")

        self.matrix_tree.pack(fill=tk.BOTH, expand=True, pady=4)

    def refresh_reports(self):
        for item in self.matrix_tree.get_children():
            self.matrix_tree.delete(item)

        diff = self.current_date.weekday()
        monday = self.current_date - timedelta(days=diff)
        week_days = [monday + timedelta(days=i) for i in range(7)]

        self.report_range_lbl.config(
            text=f"Weekly Audit: {monday.strftime('%b %d')} – {(monday + timedelta(days=6)).strftime('%b %d, %Y')}"
        )

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tasks')
        tasks = cursor.fetchall()

        cursor.execute('SELECT * FROM completions')
        completions = {(r['date'], r['task_id']): r['completed'] for r in cursor.fetchall()}
        conn.close()

        total_due = 0
        total_done = 0

        for t in tasks:
            row_vals = [t['title']]
            task_due = 0
            task_done = 0
            for d in week_days:
                d_str = d.isoformat()
                due = is_task_due(t, d)
                done = bool(completions.get((d_str, t['id']), 0))
                if due:
                    total_due += 1
                    task_due += 1
                    if done:
                        total_done += 1
                        task_done += 1
                    row_vals.append("✓" if done else "✗")
                else:
                    row_vals.append("-")

            pct_str = f"{task_done}/{task_due} ({round((task_done/task_due)*100)}%)" if task_due > 0 else "N/A"
            row_vals.append(pct_str)
            self.matrix_tree.insert("", tk.END, values=row_vals)

        overall_pct = round((total_done / total_due) * 100) if total_due > 0 else 0
        self.report_summary_lbl.config(text=f"Overall Weekly Rate: {total_done}/{total_due} ({overall_pct}%)")

    # ---------------- Manage Tasks Tab ----------------
    def build_manage_tab(self):
        btn_frame = tk.Frame(self.tab_manage, bg="#f8fafc")
        btn_frame.pack(fill=tk.X, pady=(6, 8))

        del_btn = tk.Button(btn_frame, text="Delete Selected Task", command=self.delete_selected_task, font=("Segoe UI", 9), bg="#fee2e2", fg="#991b1b", relief=tk.SOLID, bd=1, padx=8)
        del_btn.pack(side=tk.RIGHT)

        columns = ("title", "assignee", "category", "recurrence", "priority")
        self.tasks_tree = ttk.Treeview(self.tab_manage, columns=columns, show="headings", height=16)

        self.tasks_tree.heading("title", text="Task Title")
        self.tasks_tree.heading("assignee", text="Assignee")
        self.tasks_tree.heading("category", text="Category")
        self.tasks_tree.heading("recurrence", text="Recurrence Frequency")
        self.tasks_tree.heading("priority", text="Priority")

        self.tasks_tree.column("title", width=300)
        self.tasks_tree.column("assignee", width=140)
        self.tasks_tree.column("category", width=110)
        self.tasks_tree.column("recurrence", width=220)
        self.tasks_tree.column("priority", width=80)

        self.tasks_tree.pack(fill=tk.BOTH, expand=True, pady=4)

    def refresh_manage_tasks(self):
        for item in self.tasks_tree.get_children():
            self.tasks_tree.delete(item)

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC')
        tasks = cursor.fetchall()
        conn.close()

        member_map = {m['id']: m['name'] for m in self.members}

        for t in tasks:
            self.tasks_tree.insert(
                "",
                tk.END,
                iid=t['id'],
                values=(
                    t['title'],
                    member_map.get(t['assignee_id'], 'Unassigned'),
                    t['category'],
                    get_recurrence_label(t),
                    t['priority'].capitalize()
                )
            )

    def delete_selected_task(self):
        selected = self.tasks_tree.selection()
        if not selected:
            messagebox.showinfo("Select Task", "Please select a task from the list to delete.")
            return

        task_id = selected[0]
        if messagebox.askyesno("Confirm Delete", "Are you sure you want to delete this recurring task?"):
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
            cursor.execute('DELETE FROM completions WHERE task_id = ?', (task_id,))
            conn.commit()
            conn.close()
            self.refresh_manage_tasks()
            self.refresh_checklist()

    # ---------------- Add Task Dialog ----------------
    def open_add_task_dialog(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Recurring Task")
        dialog.geometry("480x520")
        dialog.transient(self.root)
        dialog.grab_set()

        frame = tk.Frame(dialog, padx=16, pady=16)
        frame.pack(fill=tk.BOTH, expand=True)

        # Title
        tk.Label(frame, text="Task Title *", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        title_entry = ttk.Entry(frame, width=50)
        title_entry.pack(fill=tk.X, pady=(2, 8))

        # Description
        tk.Label(frame, text="Description (Optional)", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        desc_entry = ttk.Entry(frame, width=50)
        desc_entry.pack(fill=tk.X, pady=(2, 8))

        # Assignee
        tk.Label(frame, text="Assignee *", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        assignee_combo = ttk.Combobox(frame, state="readonly", values=[f"{m['name']} ({m['role']})" for m in self.members])
        if self.members:
            assignee_combo.current(0)
        assignee_combo.pack(fill=tk.X, pady=(2, 8))

        # Category
        tk.Label(frame, text="Category", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        cat_entry = ttk.Entry(frame, width=50)
        cat_entry.insert(0, "Operations")
        cat_entry.pack(fill=tk.X, pady=(2, 8))

        # Recurrence Type
        tk.Label(frame, text="Recurrence Frequency *", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(4, 0))
        rec_type_var = tk.StringVar(value="daily")

        radio_frame = tk.Frame(frame)
        radio_frame.pack(fill=tk.X, pady=4)
        tk.Radiobutton(radio_frame, text="Everyday (Daily)", variable=rec_type_var, value="daily").pack(side=tk.LEFT, padx=6)
        tk.Radiobutton(radio_frame, text="Specific Weekdays", variable=rec_type_var, value="weekdays").pack(side=tk.LEFT, padx=6)
        tk.Radiobutton(radio_frame, text="Week of Month", variable=rec_type_var, value="month_week").pack(side=tk.LEFT, padx=6)

        # Weekdays Checkbox Grid
        days_frame = tk.LabelFrame(frame, text="Select Weekday(s)", padx=8, pady=6)
        day_vars = {}
        for idx, name in enumerate(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']):
            v = tk.BooleanVar(value=True if idx < 5 else False)
            # JS day indexing: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0
            js_idx = (idx + 1) % 7
            day_vars[js_idx] = v
            tk.Checkbutton(days_frame, text=name, variable=v).pack(side=tk.LEFT, padx=4)

        # Week of Month Selector
        wom_frame = tk.LabelFrame(frame, text="Which Week of Month?", padx=8, pady=6)
        wom_combo = ttk.Combobox(wom_frame, state="readonly", values=["Week 1 (Days 1–7)", "Week 2 (Days 8–14)", "Week 3 (Days 15–21)", "Week 4 (Days 22–28)"])
        wom_combo.current(0)
        wom_combo.pack(fill=tk.X)

        def on_rec_changed(*args):
            v = rec_type_var.get()
            if v == 'weekdays':
                days_frame.pack(fill=tk.X, pady=4)
                wom_frame.pack_forget()
            elif v == 'month_week':
                wom_frame.pack(fill=tk.X, pady=4)
                days_frame.pack(fill=tk.X, pady=4)
            else:
                days_frame.pack_forget()
                wom_frame.pack_forget()

        rec_type_var.trace_add("write", on_rec_changed)

        def save():
            t_title = title_entry.get().strip()
            if not t_title:
                messagebox.showerror("Validation", "Task title cannot be empty.")
                return

            sel_idx = assignee_combo.current()
            assignee_id = self.members[sel_idx]['id'] if sel_idx >= 0 else self.members[0]['id']
            rtype = rec_type_var.get()

            days = [d for d, val in day_vars.items() if val.get()] if rtype in ('weekdays', 'month_week') else None
            wom = (wom_combo.current() + 1) if rtype == 'month_week' else None

            if rtype == 'weekdays' and not days:
                messagebox.showerror("Validation", "Please select at least one weekday.")
                return

            new_id = f"task-{int(datetime.utcnow().timestamp()*1000)}"
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tasks (id, title, description, assignee_id, category, priority, recurrence_type, days_of_week, week_of_month, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                new_id,
                t_title,
                desc_entry.get().strip(),
                assignee_id,
                cat_entry.get().strip() or 'Operations',
                'normal',
                rtype,
                json.dumps(days) if days else None,
                wom,
                datetime.utcnow().isoformat()
            ))
            conn.commit()
            conn.close()

            dialog.destroy()
            self.refresh_checklist()
            self.refresh_manage_tasks()

        btn_save = tk.Button(frame, text="Save Task", command=save, font=("Segoe UI", 9, "bold"), bg="#0f172a", fg="#ffffff", padx=12, pady=6)
        btn_save.pack(side=tk.RIGHT, pady=12)

    # ---------------- Helpers ----------------
    def load_members(self):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM members')
        self.members = [dict(r) for r in cursor.fetchall()]
        conn.close()

        names = ["All Team Members"] + [f"{m['name']} ({m['role']})" for m in self.members]
        self.member_combo['values'] = names
        self.member_combo.current(0)

    def on_member_filter_changed(self, event):
        idx = self.member_combo.current()
        if idx == 0:
            self.selected_member_id = "all"
        else:
            self.selected_member_id = self.members[idx - 1]['id']
        self.refresh_checklist()

    def refresh_date_display(self):
        wk = get_week_of_month(self.current_date)
        text = f"{self.current_date.strftime('%A, %b %d, %Y')} · Week {wk} of Month"
        self.date_label.config(text=text)

    def shift_date(self, delta):
        self.current_date += timedelta(days=delta)
        self.refresh_date_display()
        self.refresh_checklist()

    def set_today(self):
        self.current_date = date.today()
        self.refresh_date_display()
        self.refresh_checklist()

    def on_tab_changed(self, event):
        tab_idx = self.notebook.index(self.notebook.select())
        if tab_idx == 0:
            self.refresh_checklist()
        elif tab_idx == 1:
            self.refresh_reports()
        elif tab_idx == 2:
            self.refresh_manage_tasks()

    def reset_demo(self):
        if messagebox.askyesno("Reset Template", "Reset database to initial 10-task demo template?"):
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM tasks')
            cursor.execute('DELETE FROM members')
            cursor.execute('DELETE FROM completions')
            seed_data(cursor)
            conn.commit()
            conn.close()
            self.load_members()
            self.refresh_checklist()
            messagebox.showinfo("Reset Complete", "Default template tasks have been restored.")

def main():
    init_db()
    root = tk.Tk()
    app = TaskFlowApp(root)
    root.mainloop()

if __name__ == '__main__':
    main()
