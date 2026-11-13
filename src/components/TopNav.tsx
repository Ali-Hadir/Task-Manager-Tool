import React, { useState, useRef, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { ViewMode } from '../types';
import {
  Plus,
  CheckSquare,
  RotateCcw,
  Shield,
  LogOut,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';

export const TopNav: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    setIsTaskModalOpen,
    setIsBulkModalOpen,
    setEditingTask,
    resetToDemo,
    currentUser,
    logout,
    users,
  } = useTasks();

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = currentUser?.isAdmin;
  const pendingCount = users.filter((u) => u.status === 'pending').length;

  // Build segregated nav items based on user role
  const navItems: { mode: ViewMode; label: string; badge?: number }[] = isAdmin
    ? [
        { mode: 'individual', label: 'Daily Checklist (All/Individual)' },
        { mode: 'team', label: 'Team Board (Leaderboard)' },
        { mode: 'reports', label: 'Reports & Audits' },
        { mode: 'manage', label: 'Task Schedules' },
        {
          mode: 'admin_users',
          label: 'User Credentials & Approvals',
          badge: pendingCount,
        },
      ]
    : [
        { mode: 'individual', label: 'Daily Checklist' },
        { mode: 'team', label: 'Team Leaderboard' },
      ];

  const handleOpenNewTask = () => {
    setIsAddMenuOpen(false);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenBulkUpload = () => {
    setIsAddMenuOpen(false);
    setIsBulkModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single element wordmark + admin badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                TaskFlow
              </span>
              {isAdmin && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded border hidden sm:inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap shrink-0">
                  <Shield className="w-3 h-3 text-indigo-600" />
                  Admin Console
                </span>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation links/tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = viewMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => setViewMode(item.mode)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white font-bold rounded-full text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary action dropdown + User profile / Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={resetToDemo}
                title="Reset to 10-Task Demo Template"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {isAdmin && (
              <div className="relative" ref={addMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {isAddMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50">
                    <button
                      type="button"
                      onClick={handleOpenNewTask}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      <div>
                        <div className="font-semibold">Add Single Task</div>
                        <div className="text-[10px] text-slate-400">Create one recurring schedule</div>
                      </div>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleOpenBulkUpload}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <div className="font-semibold">Add Multiple Tasks</div>
                        <div className="text-[10px] text-slate-400">Excel template & bulk upload</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Current user badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  @{currentUser?.username}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out of account"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
