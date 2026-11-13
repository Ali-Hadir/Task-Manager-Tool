import React from 'react';
import { useTasks } from '../context/TaskContext';
import {
  formatDateKey,
  formatDisplayDate,
  getWeekOfMonth,
  isSameDay,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

export const DateBar: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    getDueTasksForDate,
    isTaskCompleted,
    markAllForDate,
    selectedMemberId,
  } = useTasks();

  const isToday = isSameDay(selectedDate, new Date());
  const weekNum = getWeekOfMonth(selectedDate);
  const dueTasks = getDueTasksForDate(selectedDate, selectedMemberId);
  const completedCount = dueTasks.filter((t) => isTaskCompleted(t.id, selectedDate)).length;
  const totalCount = dueTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handlePrevDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() - 1);
    setSelectedDate(next);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 py-3.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Date controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={handlePrevDay}
                aria-label="Previous day"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  isToday
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={handleNextDay}
                aria-label="Next day"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {formatDisplayDate(selectedDate)}
              </h1>
              <span className="text-slate-400 text-xs hidden sm:inline">·</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Week {weekNum} of the Month
              </span>
            </div>

            {/* Hidden native datepicker triggered via calendar icon button */}
            <div className="relative inline-flex items-center">
              <label
                htmlFor="datepicker-input"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                title="Select specific date"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Jump to Date</span>
              </label>
              <input
                id="datepicker-input"
                type="date"
                value={formatDateKey(selectedDate)}
                onChange={handleDateChange}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer -z-10"
              />
            </div>
          </div>

          {/* Right: Progress and bulk action */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs text-slate-600">
                  <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due Today:</span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    {completedCount}/{totalCount}
                  </span>
                  <span>({percentage}%)</span>
                </div>
                <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200/60">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      allCompleted
                        ? 'bg-emerald-600'
                        : percentage > 50
                        ? 'bg-slate-800'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {totalCount > 0 && (
                <button
                  onClick={() => markAllForDate(selectedDate, !allCompleted, selectedMemberId)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
                    allCompleted
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {allCompleted ? 'Reset Day' : 'Check All'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
