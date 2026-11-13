import React from 'react';
import { useTasks } from '../context/TaskContext';
import { ViewMode } from '../types';
import { Plus, CheckSquare, RotateCcw, Shield, LogOut, User, Users } from 'lucide-react';

export const TopNav: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    setIsTaskModalOpen,
    setEditingTask,
    resetToDemo,
    currentUser,
    logout,
    users,
  } = useTasks();

  const isAdmin = currentUser?.isAdmin;
  const pendingCount = users.filter((u) => u.status === 'pending').length;

  // Build segregated nav items based on user role
  const navItems: { mode: ViewMode; label: string; badge?: number }[] = [
    { mode: 'individual', label: isAdmin ? 'Daily Checklist (All/Individual)' : 'My Daily Checklist' },
    { mode: 'team', label: 'Team Board (Leaderboard)' },
    { mode: 'reports', label: 'Reports & Audits' },
    { mode: 'manage', label: 'Task Schedules' },
  ];

  if (isAdmin) {
    navItems.push({
      mode: 'admin_users',
      label: 'User Credentials & Approvals',
      badge: pendingCount,
    });
  }

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single element wordmark + role badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                TaskFlow
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border hidden sm:inline-flex items-center gap-1 ${
                  isAdmin
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isAdmin ? <Shield className="w-3 h-3 text-indigo-600" /> : <User className="w-3 h-3 text-slate-500" />}
                {isAdmin ? 'Admin Console' : 'Member View'}
              </span>
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

          {/* Zone 3: Primary action button + User profile / Logout */}
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
              <button
                onClick={handleOpenNewTask}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
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
