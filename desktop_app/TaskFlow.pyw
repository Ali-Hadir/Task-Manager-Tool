#!/usr/bin/env python3
"""
TaskFlow Desktop (.pyw launcher)
On Windows, double-clicking a .pyw file opens the desktop window directly
WITHOUT showing any black terminal/command prompt window.
"""
import os
import sys

# Ensure current directory is in sys.path
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

try:
    import desktop_gui
    desktop_gui.main()
except Exception as e:
    import tkinter as tk
    from tkinter import messagebox
    root = tk.Tk()
    root.withdraw()
    messagebox.showerror("TaskFlow Error", f"Failed to start TaskFlow:\n{str(e)}")
