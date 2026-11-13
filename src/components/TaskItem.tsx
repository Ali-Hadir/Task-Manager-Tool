import React from 'react';
import { Task, TeamMember } from '../types';
import { useTasks } from '../context/TaskContext';
import { getRecurrenceLabel } from '../utils/dateUtils';
import { Check, Clock, Edit2, AlertCircle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  member?: TeamMember;
  date: Date;
  onEdit?: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, member, date, onEdit }) => {
  const { isTaskCompleted, toggleTaskCompletion, getTaskCompletion } = useTasks();

  const completed = isTaskCompleted(task.id, date);
  const completionData = getTaskCompletion(task.id, date);
  const recurrenceLabel = getRecurrenceLabel(task.recurrence);

  const formattedCompletedTime = completionData?.completedAt
    ? new Date(completionData.completedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      onClick={() => toggleTaskCompletion(task.id, date)}
      className={`group relative flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
        completed
          ? 'bg-slate-50/80 border-slate-200 text-slate-500'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-900'
      }`}
    >
      {/* Interactive Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskCompletion(task.id, date);
        }}
        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer border ${
          completed
            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
            : 'bg-white border-slate-300 hover:border-slate-400 group-hover:border-slate-400'
        }`}
      >
        {completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Main Task Information */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-semibold tracking-tight transition-colors ${
              completed ? 'line-through text-slate-400 font-normal' : 'text-slate-900'
            }`}
          >
            {task.title}
          </span>

          {task.priority === 'high' && !completed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              <AlertCircle className="w-3 h-3" />
              High
            </span>
          )}
        </div>

        {task.description && (
          <p
            className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
              completed ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Unboxed Metadata Line with typographic separators */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-2 font-medium">
          {member && (
            <span className="flex items-center gap-1.5">
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${member.color.bg} ${member.color.text}`}
              >
                {member.initials}
              </span>
              <span className="text-slate-700">{member.name}</span>
            </span>
          )}

          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>{task.category}</span>

          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="font-mono text-[11px] text-slate-500">{recurrenceLabel}</span>

          {completed && formattedCompletedTime && (
            <>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                Done at {formattedCompletedTime}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quick Edit affordance */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
          title="Edit task schedule"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
