# TaskFlow Desktop (Native GUI Edition)

A 100% free, zero-cost, standalone native desktop GUI application. Built exclusively with Python's built-in standard library (`tkinter` + `sqlite3`), requiring **zero paid software and zero external packages**.

---

## What is Inside This Folder (`desktop_app`)

- **`desktop_gui.py`**: The core native desktop GUI application (daily checklist, team filter, recurrence engine, weekly report matrix, task management dialog).
- **`TaskFlow.pyw`**: Windowed launcher (double-clicking this launches the GUI directly with **no black console/terminal window**).
- **`app_icon.ico`**: Custom desktop icon (dark slate background with a checkmark).
- **`build_windows_exe.bat`**: **One-click build script**. Generates a single standalone `TaskFlow.exe` that you can copy onto a USB stick.
- **`run_app.bat`**: One-click launcher for Windows.

---

## How to Share with Anyone via USB (2 Easy Ways)

### Method A: Single Portable `.exe` File (Recommended for USB)
*The person receiving the USB does NOT need Python, does NOT need VS Code, and does NOT need to install anything.*

1. Open this project in **Visual Studio Code** on your computer.
2. In the terminal (or directly in Windows File Explorer), double-click **`build_windows_exe.bat`** inside the `desktop_app` folder.
3. It will automatically package everything into:
   ```
   desktop_app\USB_Distribution\TaskFlow.exe
   ```
4. Copy `TaskFlow.exe` onto your **USB drive**.
5. Give the USB drive to any team member. They can double-click `TaskFlow.exe` directly on their computer. It opens immediately as a desktop application!

---

### Method B: Direct Python File on USB
If the team member already has standard Python installed:
1. Copy the `desktop_app` folder onto your USB drive.
2. Double-click **`TaskFlow.pyw`** (or `run_app.bat`).
3. The desktop app opens immediately with the native desktop window.

---

## Where Is Data Saved?

All tasks, completions, and member records are saved in a local SQLite file named **`taskflow_desktop.db`** in the same folder as the app.
When running from a USB drive, the database stays on the USB drive, so all check-offs and task history travel with the USB stick!

---

## Features
- **Daily Checklist**: Automatic day-by-day scheduling with check-off tracking and time stamps.
- **Filter by Member**: Inspect tasks for any specific team member or the entire team.
- **Recurrence Engine**: Supports Everyday tasks, specific weekdays (e.g. Mon, Tue), and Week-of-the-Month tasks (Week 1, Week 2, etc.).
- **Weekly Audit Matrix**: 7-day checklist compliance report (Mon–Sun).
- **Task Registry**: Add, edit, or delete custom tasks at any time.
- **10-Task Preloaded Template**: Pre-populated with the 10 team tasks ready to test. Click **"↺ Reset Demo"** anytime to restore default template data.
