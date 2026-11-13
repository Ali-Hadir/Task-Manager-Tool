import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types';
import { getRecurrenceLabel } from '../utils/dateUtils';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  CheckSquare,
  AlertCircle,
  Repeat,
  Download,
  Upload,
} from 'lucide-react';

export const TaskManagementView: React.FC = () => {
  const { tasks, members, deleteTask, setEditingTask, setIsTaskModalOpen } = useTasks();

  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekdays' | 'month_week'>('all');
  const [filterMember, setFilterMember] = useState<string>('all');

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const dailyCount = tasks.filter((t) => t.recurrence.type === 'daily').length;
  const weekdaysCount = tasks.filter((t) => t.recurrence.type === 'weekdays').length;
  const monthWeekCount = tasks.filter((t) => t.recurrence.type === 'month_week').length;

  const filteredTasks = tasks.filter((t) => {
    if (filterType !== 'all' && t.recurrence.type !== filterType) return false;
    if (filterMember !== 'all' && t.assigneeId !== filterMember) return false;
    return true;
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDelete = (taskId: string, title: string) => {
    if (window.confirm(`Delete recurring task "${title}"? This will remove its future and past checklist items.`)) {
      deleteTask(taskId);
    }
  };

  const handleExportJSON = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      members,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `taskflow-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          localStorage.setItem('taskflow_tasks_v2', JSON.stringify(parsed.tasks));
          if (parsed.members && Array.isArray(parsed.members)) {
            localStorage.setItem('taskflow_members_v2', JSON.stringify(parsed.members));
          }
          window.location.reload();
        } else {
          alert('Invalid TaskFlow JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header and Task Type Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Recurring Task Schedule Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure task assignments, recurrence intervals, and operational checking rules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Download task configuration backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recurring Task</span>
          </button>
        </div>
      </div>

      {/* Recurrence Distribution Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setFilterType(filterType === 'daily' ? 'all' : 'daily')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterType === 'daily'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${
                filterType === 'daily' ? 'text-slate-200' : 'text-slate-600'
              }`}
            >
              Everyday Tasks
            </span>
            <Repeat className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-extrabold font-mono mt-1 tabular-nums">
            {dailyCount}
          </div>
          <p
            className={`text-[11px] mt-0.5 ${
              filterType === 'daily' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Checked daily, 7 days a week
          </p>
        </div>

        <div
          onClick={() => setFilterType(filterType === 'weekdays' ? 'all' : 'weekdays')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterType === 'weekdays'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${
                filterType === 'weekdays' ? 'text-slate-200' : 'text-slate-600'
              }`}
            >
              Specific Day Tasks
            </span>
            <Calendar className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-extrabold font-mono mt-1 tabular-nums">
            {weekdaysCount}
          </div>
          <p
            className={`text-[11px] mt-0.5 ${
              filterType === 'weekdays' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Due on designated weekdays (Mon, Tue, etc.)
          </p>
        </div>

        <div
          onClick={() => setFilterType(filterType === 'month_week' ? 'all' : 'month_week')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterType === 'month_week'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${
                filterType === 'month_week' ? 'text-slate-200' : 'text-slate-600'
              }`}
            >
              Week-of-Month Tasks
            </span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-extrabold font-mono mt-1 tabular-nums">
            {monthWeekCount}
          </div>
          <p
            className={`text-[11px] mt-0.5 ${
              filterType === 'month_week' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Allocated for 1st week, 2nd week, etc.
          </p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter by Member:</span>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden"
            >
              <option value="all">All Team Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>

        {/* Task Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4 w-72">Task Title & Category</th>
                <th className="py-3 px-4">Responsible Member</th>
                <th className="py-3 px-4">Recurrence Frequency</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const member = memberMap.get(task.assigneeId);
                const recurrenceLabel = getRecurrenceLabel(task.recurrence);

                return (
                  <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{task.title}</div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                          {task.description}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        {task.category}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {member ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${member.color.bg} ${member.color.text}`}
                          >
                            {member.initials}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">{member.name}</div>
                            <div className="text-[10px] text-slate-500">{member.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 text-xs font-medium">
                        {recurrenceLabel}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {task.recurrence.type === 'month_week'
                          ? 'Monthly Week'
                          : task.recurrence.type}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {task.priority === 'high' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          High
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Normal</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id, task.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
