import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import {
  formatDateKey,
  getWeekDates,
  getMonthDates,
  getMonthWeeksGrouped,
  isTaskDueOnDate,
  WEEKDAY_SHORT,
  getWeekOfMonth,
} from '../utils/dateUtils';
import {
  CheckCircle2,
  XCircle,
  Minus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Award,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { tasks, members, completions, selectedDate, setSelectedDate } = useTasks();

  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [reportDate, setReportDate] = useState<Date>(() => new Date(selectedDate));

  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Weekly calculations
  const weekDates = getWeekDates(reportDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  let totalWeeklyDue = 0;
  let totalWeeklyCompleted = 0;

  const memberWeeklyStats: Record<
    string,
    { memberId: string; due: number; completed: number }
  > = {};

  members.forEach((m) => {
    memberWeeklyStats[m.id] = { memberId: m.id, due: 0, completed: 0 };
  });

  weekDates.forEach((date) => {
    const dateKey = formatDateKey(date);
    tasks.forEach((task) => {
      const isDue = isTaskDueOnDate(task, date);
      if (isDue) {
        totalWeeklyDue++;
        const isComp = Boolean(completions[`${dateKey}_${task.id}`]?.completed);
        if (isComp) {
          totalWeeklyCompleted++;
        }

        if (memberWeeklyStats[task.assigneeId]) {
          memberWeeklyStats[task.assigneeId].due++;
          if (isComp) {
            memberWeeklyStats[task.assigneeId].completed++;
          }
        }
      }
    });
  });

  const weeklyPercentage =
    totalWeeklyDue > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyDue) * 100) : 0;
  const isWeeklyAllCompleted = totalWeeklyDue > 0 && totalWeeklyCompleted === totalWeeklyDue;

  // Monthly calculations
  const currentYear = reportDate.getFullYear();
  const currentMonth = reportDate.getMonth();
  const monthDates = getMonthDates(currentYear, currentMonth);
  const monthWeeks = getMonthWeeksGrouped(currentYear, currentMonth);

  let totalMonthlyDue = 0;
  let totalMonthlyCompleted = 0;

  monthDates.forEach((date) => {
    const dateKey = formatDateKey(date);
    tasks.forEach((task) => {
      if (isTaskDueOnDate(task, date)) {
        totalMonthlyDue++;
        if (completions[`${dateKey}_${task.id}`]?.completed) {
          totalMonthlyCompleted++;
        }
      }
    });
  });

  const monthlyPercentage =
    totalMonthlyDue > 0 ? Math.round((totalMonthlyCompleted / totalMonthlyDue) * 100) : 0;

  // Week shift controls
  const handlePrevWeek = () => {
    const next = new Date(reportDate);
    next.setDate(next.getDate() - 7);
    setReportDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(reportDate);
    next.setDate(next.getDate() + 7);
    setReportDate(next);
  };

  const handlePrevMonth = () => {
    const next = new Date(reportDate);
    next.setMonth(next.getMonth() - 1);
    setReportDate(next);
  };

  const handleNextMonth = () => {
    const next = new Date(reportDate);
    next.setMonth(next.getMonth() + 1);
    setReportDate(next);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        {/* Toggle between Weekly and Monthly */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setReportType('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              reportType === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              reportType === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Report
          </button>
        </div>

        {/* Date cycle switcher */}
        <div className="flex items-center gap-2">
          {reportType === 'weekly' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                aria-label="Previous week"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800">
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                {weekEnd.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={handleNextWeek}
                aria-label="Next week"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800">
                {reportDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer ml-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / Export</span>
          </button>
        </div>
      </div>

      {/* WEEKLY REPORT VIEW */}
      {reportType === 'weekly' && (
        <div className="space-y-6">
          {/* Executive Weekly Summary Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isWeeklyAllCompleted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isWeeklyAllCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {isWeeklyAllCompleted ? (
                  <Award className="w-5 h-5" />
                ) : (
                  <FileCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {isWeeklyAllCompleted
                    ? '100% Weekly Verification Accomplished!'
                    : 'Weekly Operational Verification Audit'}
                </h3>
                <p className="text-xs mt-0.5 text-slate-600">
                  {isWeeklyAllCompleted
                    ? 'Every single scheduled task for this week was verified and marked complete across all members.'
                    : `Completed ${totalWeeklyCompleted} out of ${totalWeeklyDue} scheduled tasks across the week.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Weekly Rate
                </span>
                <div className="text-2xl font-extrabold font-mono tabular-nums leading-none mt-1">
                  {weeklyPercentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Member Weekly Compliance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {members.map((m) => {
              const stat = memberWeeklyStats[m.id];
              const pct = stat.due > 0 ? Math.round((stat.completed / stat.due) * 100) : 0;
              const perfect = stat.due > 0 && stat.completed === stat.due;

              return (
                <div
                  key={m.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-md text-[11px] flex items-center justify-center font-bold ${m.color.bg} ${m.color.text}`}
                    >
                      {m.initials}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold tabular-nums ${
                        perfect ? 'text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{m.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {stat.completed} / {stat.due} completed
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7-Day Day-by-Day Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                  7-Day Task Execution Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verification status for every recurring task across Monday through Sunday.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Done
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" /> Pending/Missed
                </span>
                <span className="flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5 text-slate-300" /> Not Due
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-2.5 px-4 font-semibold text-slate-700 w-72">Task / Assignee</th>
                    {weekDates.map((d, idx) => (
                      <th
                        key={idx}
                        className="py-2.5 px-3 text-center font-semibold text-slate-700 w-20"
                      >
                        <div>{WEEKDAY_SHORT[d.getDay()]}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {d.getDate()}
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-right font-semibold text-slate-700 w-24">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => {
                    const member = memberMap.get(task.assigneeId);
                    let taskDueDays = 0;
                    let taskDoneDays = 0;

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 truncate max-w-xs">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span>{member?.name}</span>
                            <span aria-hidden="true">·</span>
                            <span>{task.category}</span>
                          </div>
                        </td>

                        {weekDates.map((date, idx) => {
                          const dateKey = formatDateKey(date);
                          const isDue = isTaskDueOnDate(task, date);
                          const isCompleted = Boolean(
                            completions[`${dateKey}_${task.id}`]?.completed
                          );

                          if (isDue) {
                            taskDueDays++;
                            if (isCompleted) taskDoneDays++;
                          }

                          return (
                            <td key={idx} className="py-3 px-3 text-center">
                              {!isDue ? (
                                <span className="text-slate-200 inline-block">
                                  <Minus className="w-3.5 h-3.5 mx-auto" />
                                </span>
                              ) : isCompleted ? (
                                <span
                                  className="text-emerald-600 inline-block"
                                  title={`Completed on ${dateKey}`}
                                >
                                  <CheckCircle2 className="w-4 h-4 mx-auto" />
                                </span>
                              ) : (
                                <span
                                  className="text-rose-400 inline-block"
                                  title={`Due but not completed on ${dateKey}`}
                                >
                                  <XCircle className="w-4 h-4 mx-auto" />
                                </span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-700">
                          {taskDueDays > 0 ? (
                            <span>
                              {taskDoneDays}/{taskDueDays}
                            </span>
                          ) : (
                            <span className="text-slate-400">0/0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT VIEW */}
      {reportType === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Total Monthly Scheduled Checks
              </span>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1 tabular-nums">
                {totalMonthlyDue}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Across {monthDates.length} calendar days
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Completed Verifications
              </span>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 tabular-nums">
                {totalMonthlyCompleted}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Historical records verified by team
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Monthly Compliance Score
              </span>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1 tabular-nums">
                {monthlyPercentage}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Aggregate compliance benchmark
              </p>
            </div>
          </div>

          {/* Week-by-Week Progress in the Month */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight mb-4">
              Week-by-Week Performance for{' '}
              {reportDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>

            <div className="space-y-3">
              {monthWeeks.map(({ weekNum, dates }) => {
                let weekDue = 0;
                let weekCompleted = 0;

                dates.forEach((d) => {
                  const dateKey = formatDateKey(d);
                  tasks.forEach((t) => {
                    if (isTaskDueOnDate(t, d)) {
                      weekDue++;
                      if (completions[`${dateKey}_${t.id}`]?.completed) {
                        weekCompleted++;
                      }
                    }
                  });
                });

                const pct = weekDue > 0 ? Math.round((weekCompleted / weekDue) * 100) : 0;
                const startDay = dates[0].getDate();
                const endDay = dates[dates.length - 1].getDate();

                return (
                  <div
                    key={weekNum}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Week {weekNum} ({startDay}th – {endDay}th)
                        </span>
                        {weekNum === 1 && (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-200/60 px-1.5 py-0.5 rounded">
                            Includes Week 1 Monthly Tasks
                          </span>
                        )}
                        {weekNum === 2 && (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-200/60 px-1.5 py-0.5 rounded">
                            Includes Week 2 Monthly Tasks
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {weekCompleted} of {weekDue} checks verified
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 tabular-nums w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Fulfillment Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Recurring Task Fulfillment Roster
              </h3>
              <p className="text-[11px] text-slate-500">
                Detailed monthly performance per task item.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-4">Task Name</th>
                    <th className="py-2.5 px-4">Assignee</th>
                    <th className="py-2.5 px-4">Recurrence</th>
                    <th className="py-2.5 px-4 text-center">Due Count</th>
                    <th className="py-2.5 px-4 text-center">Completed</th>
                    <th className="py-2.5 px-4 text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((t) => {
                    const member = memberMap.get(t.assigneeId);
                    let due = 0;
                    let completed = 0;

                    monthDates.forEach((d) => {
                      if (isTaskDueOnDate(t, d)) {
                        due++;
                        const k = `${formatDateKey(d)}_${t.id}`;
                        if (completions[k]?.completed) {
                          completed++;
                        }
                      }
                    });

                    const pct = due > 0 ? Math.round((completed / due) * 100) : 0;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{t.title}</td>
                        <td className="py-3 px-4 text-slate-600">{member?.name}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {t.recurrence.type === 'daily'
                            ? 'Daily'
                            : t.recurrence.type === 'weekdays'
                            ? 'Specific Weekdays'
                            : `Week ${t.recurrence.weekOfMonth} of Month`}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">{due}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-emerald-700 font-semibold">
                          {completed}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
