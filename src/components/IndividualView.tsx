import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { formatDisplayDate } from '../utils/dateUtils';
import { CheckCircle2, Search, Plus, Calendar, User } from 'lucide-react';

export const IndividualView: React.FC = () => {
  const {
    tasks,
    members,
    selectedDate,
    selectedMemberId,
    setSelectedMemberId,
    getDueTasksForDate,
    isTaskCompleted,
    setEditingTask,
    setIsTaskModalOpen,
    currentUser,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'pending' | 'completed'>('all');

  const isAdmin = currentUser?.isAdmin;

  // If not admin, restrict strictly to current user's tasks
  const dueTasks = getDueTasksForDate(selectedDate, isAdmin ? selectedMemberId : currentUser?.memberId);

  const filteredTasks = dueTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const completed = isTaskCompleted(t.id, selectedDate);
    if (filterState === 'pending') return !completed;
    if (filterState === 'completed') return completed;
    return true;
  });

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const currentMember =
    !isAdmin && currentUser?.memberId
      ? memberMap.get(currentUser.memberId)
      : selectedMemberId !== 'all'
      ? memberMap.get(selectedMemberId)
      : null;

  const totalDueCount = dueTasks.length;
  const completedCount = dueTasks.filter((t) => isTaskCompleted(t.id, selectedDate)).length;
  const allFinished = totalDueCount > 0 && completedCount === totalDueCount;

  const handleEdit = (task: any) => {
    if (!isAdmin) return; // Only admin can edit recurring rules
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      {!isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-slate-900">
              Personal Checklist for {currentUser?.name}
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded whitespace-nowrap shrink-0">
            Role: {currentUser?.role}
          </span>
        </div>
      )}

      {/* Member Selection Tabs (Admin only) & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {isAdmin ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedMemberId('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedMemberId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Members ({tasks.filter((t) => getDueTasksForDate(selectedDate).some((dt) => dt.id === t.id)).length})
            </button>

            {members.map((m) => {
              const memberTasks = getDueTasksForDate(selectedDate, m.id);
              const memberCompleted = memberTasks.filter((t) => isTaskCompleted(t.id, selectedDate)).length;
              const isSelected = selectedMemberId === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isSelected ? 'bg-white/20 text-white' : `${m.color.bg} ${m.color.text}`
                    }`}
                  >
                    {m.initials}
                  </span>
                  <span>{m.name}</span>
                  <span className={`text-[10px] font-mono tabular-nums opacity-75`}>
                    ({memberCompleted}/{memberTasks.length})
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-700">
            {formatDisplayDate(selectedDate)}
          </div>
        )}

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-hidden focus:border-slate-400 transition-colors"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterState('all')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filterState === 'all' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterState('pending')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filterState === 'pending' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterState('completed')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filterState === 'completed' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Checked
            </button>
          </div>
        </div>
      </div>

      {/* 100% Completion Celebration Banner */}
      {allFinished && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-900">
                All scheduled tasks completed for {formatDisplayDate(selectedDate)}
              </h2>
              <p className="text-xs text-emerald-700">
                {currentMember ? `${currentMember.name}'s` : 'All team'} duties have been verified and recorded for audit reports.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-800 tabular-nums bg-emerald-100/80 px-2.5 py-1 rounded-lg">
            100% COMPLIANCE
          </span>
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              member={isAdmin ? memberMap.get(task.assigneeId) : undefined}
              date={selectedDate}
              onEdit={isAdmin ? handleEdit : undefined}
              minimal={!isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              No tasks scheduled for {formatDisplayDate(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? 'No tasks match your current search query.'
                : currentMember
                ? `${currentMember.name} has no tasks configured for this day. Recurrence rules ensure only relevant tasks appear on their due dates.`
                : 'No tasks across the team are due on this date.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Task</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
