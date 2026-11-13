import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { RecurrenceType, Task } from '../types';
import { WEEKDAY_SHORT } from '../utils/dateUtils';
import { X, Calendar, User, Tag, AlertCircle, Clock } from 'lucide-react';

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    members,
    addTask,
    updateTask,
  } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [category, setCategory] = useState('Operations');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');

  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [weekOfMonth, setWeekOfMonth] = useState<number>(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setAssigneeId(editingTask.assigneeId);
      setCategory(editingTask.category);
      setPriority(editingTask.priority || 'normal');
      setRecurrenceType(editingTask.recurrence.type);
      setSelectedDays(editingTask.recurrence.daysOfWeek || [1]);
      setWeekOfMonth(editingTask.recurrence.weekOfMonth || 1);
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId(members[0]?.id || '');
      setCategory('Operations');
      setPriority('normal');
      setRecurrenceType('daily');
      setSelectedDays([1]);
      setWeekOfMonth(1);
    }
    setError('');
  }, [editingTask, isTaskModalOpen, members]);

  if (!isTaskModalOpen) return null;

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const setPresetDays = (preset: 'mon-fri' | 'all') => {
    if (preset === 'mon-fri') {
      setSelectedDays([1, 2, 3, 4, 5]);
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!assigneeId) {
      setError('Please assign a team member');
      return;
    }
    if (recurrenceType === 'weekdays' && selectedDays.length === 0) {
      setError('Please select at least one day of the week');
      return;
    }

    const recurrence = {
      type: recurrenceType,
      daysOfWeek: recurrenceType === 'daily' ? undefined : selectedDays,
      weekOfMonth: recurrenceType === 'month_week' ? weekOfMonth : undefined,
    };

    if (editingTask) {
      updateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim(),
        assigneeId,
        category: category.trim() || 'General',
        priority,
        recurrence,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim(),
        assigneeId,
        category: category.trim() || 'General',
        priority,
        recurrence,
      });
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingTask ? 'Edit Recurring Task' : 'Create New Recurring Task'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set title, responsible assignee, and verification frequency.
            </p>
          </div>
          <button
            onClick={() => {
              setIsTaskModalOpen(false);
              setEditingTask(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tuesday Vendor Invoice & Ledger Reconciliation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions & Verification Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Provide exact verification steps for the member checking this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 transition-colors resize-none"
            />
          </div>

          {/* Assignee & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsible Assignee *
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 transition-colors"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="Operations, Finance, Support..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 transition-colors"
              >
              </input>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority Level
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  priority === 'normal'
                    ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  priority === 'high'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                High Priority
              </button>
            </div>
          </div>

          {/* Recurrence Frequency Engine */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              Recurrence & Checking Frequency *
            </label>

            {/* Recurrence Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrenceType('daily')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  recurrenceType === 'daily'
                    ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">Everyday</div>
                <div className="text-[10px] text-slate-500 mt-0.5">7 days a week</div>
              </button>

              <button
                type="button"
                onClick={() => setRecurrenceType('weekdays')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  recurrenceType === 'weekdays'
                    ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">Specific Days</div>
                <div className="text-[10px] text-slate-500 mt-0.5">e.g. Mon, Tue...</div>
              </button>

              <button
                type="button"
                onClick={() => setRecurrenceType('month_week')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  recurrenceType === 'month_week'
                    ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">Week of Month</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Week 1 or Week 2</div>
              </button>
            </div>

            {/* Recurrence Type Details */}
            {recurrenceType === 'daily' && (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                This task will automatically populate every single day (Monday through Sunday) for the assigned member to check.
              </p>
            )}

            {recurrenceType === 'weekdays' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Select Days of the Week:</span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPresetDays('mon-fri')}
                      className="text-slate-800 underline cursor-pointer"
                    >
                      Mon–Fri
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDays('all')}
                      className="text-slate-800 underline cursor-pointer"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const isSelected = selectedDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {WEEKDAY_SHORT[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {recurrenceType === 'month_week' && (
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-1.5">
                    Which Week of the Month?
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((wk) => (
                      <button
                        key={wk}
                        type="button"
                        onClick={() => setWeekOfMonth(wk)}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          weekOfMonth === wk
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Week {wk}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Week 1 = Days 1–7 · Week 2 = Days 8–14 · Week 3 = Days 15–21 · Week 4 = Days 22–28
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-1.5">
                    Specific Day(s) during Week {weekOfMonth}:
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                      const isSelected = selectedDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {WEEKDAY_SHORT[d]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsTaskModalOpen(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {editingTask ? 'Save Changes' : 'Create Recurring Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
