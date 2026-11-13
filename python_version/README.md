# TaskFlow: Minimalist Recurring Task Hub (Python Edition)

A completely standalone Python edition of the TaskFlow recurring task builder and daily verification hub. It uses Python's built-in standard library (`http.server`, `sqlite3`, `json`) so you can run it anywhere with **zero `pip install` commands required**.

---

## Quick Start

1. Open your terminal in this folder (`python_version`):
   ```bash
   cd python_version
   ```

2. Run the application:
   ```bash
   python3 app.py
   ```
   *(Or on Windows: `python app.py`)*

3. Open your browser at:
   ```
   http://localhost:5000
   ```

---

## Features Included

- **Automated Day Rollover**: Evaluates whether tasks are due for the selected date based on recurrence rules:
  - **Everyday Tasks**: Automatically populates 7 days a week.
  - **Specific Days of Week**: Populates on designated weekdays (e.g. Monday, Tuesday, Thursday).
  - **Week of the Month**: Populates on 1st, 2nd, 3rd, or 4th week of the month (e.g. Week 1 Monday).
- **Interactive Daily Checklist**: Check off items, view live progress counters, and filter by team member or view all team tasks.
- **Weekly Verification Matrix**: 7-day compliance matrix showing which tasks were due, verified, or pending for the entire week.
- **Task Schedule Registry**: View all recurring schedules, create new tasks, and delete expired tasks.
- **SQLite Database Persistence**: All tasks, team members, and historical completions are persistently stored in `taskflow.db`.
- **Preloaded 10-Task Template**: Starts with the 10 standard team tasks across operations, finance, support, and infrastructure, ready to test immediately. Click **"↺ Reset"** in the top bar anytime to restore the default template.

---

## Database Schema (SQLite)

- `members`: Team members and role metadata.
- `tasks`: Recurring tasks, recurrence rules, and assignees.
- `completions`: Historical log of completion per `(task_id, date)`.
