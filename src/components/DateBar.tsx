import React, { useState, useRef, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import {
  formatDisplayDate,
  getWeekOfMonth,
  isSameDay,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ListTodo,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DateBar: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    getDueTasksForDate,
    isTaskCompleted,
    markAllForDate,
    selectedMemberId,
    currentUser,
  } = useTasks();

  const isAdmin = currentUser?.isAdmin;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
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
    const now = new Date();
    setSelectedDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsCalendarOpen(false);
  };

  const handleToggleCalendar = () => {
    if (!isCalendarOpen) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
    setIsCalendarOpen((prev) => !prev);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
    setIsCalendarOpen(false);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const currentYear = today.getFullYear();
  const minYear = Math.min(currentYear - 10, viewYear);
  const maxYear = Math.max(currentYear + 10, viewYear);
  const yearOptions = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  return (
    <div className="bg-white border-b border-slate-200 py-3.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Date controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevDay}
                aria-label="Previous day"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isToday
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
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
              {isAdmin && (
                <>
                  <span className="text-slate-400 text-xs hidden sm:inline">·</span>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    Week {weekNum} of the Month
                  </span>
                </>
              )}
            </div>

            {/* Interactive calendar popover trigger */}
            <div className="relative inline-flex items-center" ref={calendarRef}>
              <button
                type="button"
                onClick={handleToggleCalendar}
                aria-expanded={isCalendarOpen}
                aria-haspopup="dialog"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  isCalendarOpen
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
                title="Open calendar to select any date"
              >
                <CalendarIcon className={`w-3.5 h-3.5 ${isCalendarOpen ? 'text-white' : 'text-slate-500'}`} />
                <span>Jump to Date</span>
              </button>

              {isCalendarOpen && (
                <div
                  role="dialog"
                  aria-label="Select date calendar"
                  className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-40"
                >
                  {/* Calendar Month & Year Navigation */}
                  <div className="flex items-center justify-between gap-1.5 mb-3">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      aria-label="Previous month"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <select
                        aria-label="Select month"
                        value={viewMonth}
                        onChange={(e) => setViewMonth(Number(e.target.value))}
                        className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-hidden focus:border-slate-400 cursor-pointer"
                      >
                        {MONTH_NAMES.map((name, idx) => (
                          <option key={name} value={idx}>
                            {name}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="Select year"
                        value={viewYear}
                        onChange={(e) => setViewYear(Number(e.target.value))}
                        className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 font-mono tabular-nums focus:outline-hidden focus:border-slate-400 cursor-pointer"
                      >
                        {yearOptions.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      aria-label="Next month"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday Header */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {WEEKDAY_LABELS.map((day) => (
                      <div
                        key={day}
                        className="text-center text-[11px] font-semibold text-slate-400 py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Day Cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-8" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const cellDate = new Date(viewYear, viewMonth, day);
                      const isSelectedCell = isSameDay(cellDate, selectedDate);
                      const isTodayCell = isSameDay(cellDate, today);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          className={`h-8 w-full rounded-lg text-xs font-mono tabular-nums flex items-center justify-center transition-colors cursor-pointer ${
                            isSelectedCell
                              ? 'bg-slate-900 text-white font-semibold'
                              : isTodayCell
                              ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-300 hover:bg-slate-200'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleToday}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Jump to Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
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
