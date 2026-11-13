import React from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { formatDisplayDate } from '../utils/dateUtils';
import { Users, Award, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const TeamBoardView: React.FC = () => {
  const {
    members,
    selectedDate,
    getDueTasksForDate,
    isTaskCompleted,
    markAllForDate,
    setEditingTask,
    setIsTaskModalOpen,
    currentUser,
  } = useTasks();

  const isAdmin = currentUser?.isAdmin;

  const handleEdit = (task: any) => {
    if (!isAdmin) return;
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const allDueTasksToday = getDueTasksForDate(selectedDate, 'all');
  const totalCompleted = allDueTasksToday.filter((t) => isTaskCompleted(t.id, selectedDate)).length;
  const overallPercentage =
    allDueTasksToday.length > 0
      ? Math.round((totalCompleted / allDueTasksToday.length) * 100)
      : 0;

  // Calculate Performance Ranking per Member
  const memberPerformance = members.map((member) => {
    const memberTasks = getDueTasksForDate(selectedDate, member.id);
    const completedCount = memberTasks.filter((t) =>
      isTaskCompleted(t.id, selectedDate)
    ).length;
    const total = memberTasks.length;
    const rate = total > 0 ? Math.round((completedCount / total) * 100) : 100;
    const isSelf = currentUser?.memberId === member.id;

    return {
      member,
      memberTasks,
      completedCount,
      total,
      rate,
      isComplete: total > 0 && completedCount === total,
      isSelf,
    };
  });

  // Sort by completion rate descending
  const rankedMembers = [...memberPerformance].sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    return b.completedCount - a.completedCount;
  });

  return (
    <div className="space-y-6">
      {/* Team Summary & Performance Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-heading">
              Team Execution & Performance Board · {formatDisplayDate(selectedDate)}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-user status across all teammates showing who completed their duties and who has pending items.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500">Overall Team Compliance</span>
            <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {totalCompleted} / {allDueTasksToday.length}{' '}
              <span className="text-xs font-normal text-slate-500">({overallPercentage}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary Cards (Who completed vs Who has pending tasks) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Top Performing Today</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900">
            {rankedMembers[0] && rankedMembers[0].total > 0
              ? `${rankedMembers[0].member.name} (${rankedMembers[0].rate}%)`
              : 'All up to date'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {rankedMembers[0]?.completedCount || 0} tasks completed
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Completed All Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-700 tabular-nums">
            {rankedMembers.filter((m) => m.isComplete).length} / {members.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Members with 100% verification
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Pending Verifications</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {allDueTasksToday.length - totalCompleted}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tasks awaiting check-off today
          </p>
        </div>
      </div>

      {/* Member Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {rankedMembers.map(({ member, memberTasks, completedCount, total, isComplete, rate, isSelf }) => {
          return (
            <div
              key={member.id}
              className={`bg-white border rounded-xl overflow-hidden flex flex-col min-h-[320px] transition-all ${
                isSelf
                  ? 'ring-2 ring-slate-900 border-slate-900 shadow-sm'
                  : 'border-slate-200'
              }`}
            >
              {/* Member Column Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center font-bold ${member.color.bg} ${member.color.text} border ${member.color.border}`}
                    >
                      {member.initials}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {member.name}
                        </h3>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/60 text-slate-700'
                    }`}
                  >
                    {completedCount}/{total}
                  </span>
                </div>

                {/* Progress bar with percentage */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                      style={{
                        width: total > 0 ? `${(completedCount / total) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-700 tabular-nums">
                    {rate}%
                  </span>
                </div>
              </div>

              {/* Task list for this member */}
              <div className="p-3 flex-1 flex flex-col gap-2">
                {memberTasks.length > 0 ? (
                  memberTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      date={selectedDate}
                      onEdit={isAdmin ? handleEdit : undefined}
                    />
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                    <p className="text-xs">No tasks due today</p>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Scheduled for other days
                    </span>
                  </div>
                )}
              </div>

              {/* Member card footer quick action */}
              {total > 0 && (
                <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {isComplete ? 'All verified' : `${total - completedCount} pending`}
                  </span>
                  {(isAdmin || isSelf) && (
                    <button
                      onClick={() => markAllForDate(selectedDate, !isComplete, member.id)}
                      className="text-slate-700 hover:text-slate-900 font-semibold hover:underline cursor-pointer text-[11px]"
                    >
                      {isComplete ? 'Reset' : 'Check All'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
