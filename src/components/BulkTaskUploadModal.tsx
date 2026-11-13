import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useTasks } from '../context/TaskContext';
import { RecurrenceRule, RecurrenceType, Task } from '../types';
import { getRecurrenceLabel } from '../utils/dateUtils';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface ParsedTaskRow {
  rowNum: number;
  valid: boolean;
  error?: string;
  assigneeName?: string;
  taskInput?: Omit<Task, 'id' | 'createdAt'>;
  rawTitle: string;
  rawAssignee: string;
}

const DAY_NAME_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  '0': 0,
  '7': 0,
  mon: 1,
  monday: 1,
  '1': 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  '2': 2,
  wed: 3,
  wednesday: 3,
  '3': 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  '4': 4,
  fri: 5,
  friday: 5,
  '5': 5,
  sat: 6,
  saturday: 6,
  '6': 6,
};

function parseWeekdaysString(raw: string): { days: number[]; invalidTokens: string[] } {
  if (!raw.trim()) return { days: [], invalidTokens: [] };
  const tokens = raw
    .split(/[,;/|]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const days = new Set<number>();
  const invalidTokens: string[] = [];

  tokens.forEach((tok) => {
    if (tok in DAY_NAME_MAP) {
      days.add(DAY_NAME_MAP[tok]);
    } else {
      invalidTokens.push(tok);
    }
  });

  return { days: Array.from(days).sort((a, b) => a - b), invalidTokens };
}

function normalizeFrequencyType(raw: string): RecurrenceType | null {
  const val = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['daily', 'everyday', 'every_day'].includes(val)) return 'daily';
  if (['weekdays', 'weekday', 'specific_days', 'specific_weekdays', 'weekly'].includes(val)) {
    return 'weekdays';
  }
  if (['month_week', 'week_of_month', 'monthly', 'monthly_week'].includes(val)) {
    return 'month_week';
  }
  return null;
}

export const BulkTaskUploadModal: React.FC = () => {
  const {
    isBulkModalOpen,
    setIsBulkModalOpen,
    members,
    users,
    addMultipleTasks,
  } = useTasks();

  const [parsedRows, setParsedRows] = useState<ParsedTaskRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBulkModalOpen) return null;

  const handleClose = () => {
    setIsBulkModalOpen(false);
    setParsedRows([]);
    setFileName('');
    setParseError('');
    setImportSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const m0 = members[0]?.name || 'Alex Chen';
    const m1 = members[1]?.name || 'Sarah Jenkins';
    const m2 = members[2]?.name || 'Elena Rostova';

    const templateData = [
      [
        'Title',
        'Description',
        'Assignee',
        'Category',
        'Priority',
        'Frequency Type',
        'Weekdays',
        'Week of Month',
      ],
      [
        'Daily System & Email Triage',
        'Check priority inbox items and confirm service health.',
        m0,
        'Operations',
        'high',
        'daily',
        '',
        '',
      ],
      [
        'Client Check-in & Escalation Review',
        'Review open client accounts scheduled for Monday & Thursday.',
        m1,
        'Client Support',
        'normal',
        'weekdays',
        'Mon, Thu',
        '',
      ],
      [
        'Week 1 Financial Ledger Audit',
        'Monthly reconciliation during the first week of the month.',
        m2,
        'Finance',
        'high',
        'month_week',
        'Mon',
        1,
      ],
    ];

    const wb = XLSX.utils.book_new();
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);

    wsTemplate['!cols'] = [
      { wch: 34 },
      { wch: 44 },
      { wch: 20 },
      { wch: 16 },
      { wch: 10 },
      { wch: 16 },
      { wch: 20 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Tasks Template');

    // Second sheet: Team Roster & Instructions for easy lookup
    const rosterRows: (string | number)[][] = [
      ['TASKFLOW EXCEL UPLOAD GUIDE & TEAM ROSTER', '', '', ''],
      ['', '', '', ''],
      ['1. VALID TEAM ASSIGNEES (Use Name or Username in the Assignee column):', '', '', ''],
      ['Member Name', 'Username', 'Role', 'Member ID'],
    ];

    members.forEach((m) => {
      const linkedUser = users.find((u) => u.memberId === m.id);
      rosterRows.push([m.name, linkedUser?.username || '', m.role, m.id]);
    });

    rosterRows.push(['', '', '', '']);
    rosterRows.push(['2. FIELD RULES:', '', '', '']);
    rosterRows.push(['Column', 'Allowed Values', 'Notes', '']);
    rosterRows.push(['Title', 'Text (max 300 chars)', 'Required', '']);
    rosterRows.push(['Description', 'Text (optional)', 'Verification steps for the teammate', '']);
    rosterRows.push(['Assignee', 'Member Name or Username', 'Must match an active teammate listed above', '']);
    rosterRows.push(['Category', 'Text (e.g. Operations, Finance)', 'Defaults to Operations if blank', '']);
    rosterRows.push(['Priority', 'normal or high', 'Defaults to normal if blank', '']);
    rosterRows.push(['Frequency Type', 'daily, weekdays, or month_week', 'Required', '']);
    rosterRows.push(['Weekdays', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Comma-separated (required for weekdays; optional for month_week)', '']);
    rosterRows.push(['Week of Month', '1, 2, 3, or 4', 'Required when Frequency Type is month_week', '']);

    const wsGuide = XLSX.utils.aoa_to_sheet(rosterRows);
    wsGuide['!cols'] = [{ wch: 28 }, { wch: 32 }, { wch: 48 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Team & Rules Guide');

    XLSX.writeFile(wb, `TaskFlow-Bulk-Tasks-Template-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const resolveMember = (rawAssignee: string) => {
    const clean = rawAssignee.trim().toLowerCase();
    if (!clean) return null;

    // 1. Direct match by member name, email, or id
    const directMember = members.find(
      (m) =>
        m.name.toLowerCase() === clean ||
        m.id.toLowerCase() === clean ||
        (m.email && m.email.toLowerCase() === clean)
    );
    if (directMember) return directMember;

    // 2. Match via user username or name -> memberId
    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === clean || u.name.toLowerCase() === clean
    );
    if (matchedUser) {
      return members.find((m) => m.id === matchedUser.memberId) || null;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setImportSuccess('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName =
          workbook.SheetNames.find((n) => n.toLowerCase().includes('template')) ||
          workbook.SheetNames[0];

        if (!sheetName) {
          setParseError('The uploaded workbook contains no sheets.');
          setParsedRows([]);
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
        });

        if (jsonRows.length === 0) {
          setParseError('No task rows found in the uploaded sheet. Please populate rows beneath the header.');
          setParsedRows([]);
          return;
        }

        const results: ParsedTaskRow[] = jsonRows.map((row, index) => {
          // Normalize keys case-insensitively
          const norm: Record<string, string> = {};
          Object.entries(row).forEach(([k, v]) => {
            norm[k.trim().toLowerCase().replace(/[\s_-]+/g, '')] = String(v ?? '').trim();
          });

          const rawTitle = norm['title'] || norm['tasktitle'] || norm['task'] || '';
          const rawDesc = norm['description'] || norm['details'] || norm['notes'] || '';
          const rawAssignee = norm['assignee'] || norm['member'] || norm['user'] || norm['username'] || '';
          const rawCategory = norm['category'] || norm['department'] || 'Operations';
          const rawPriority = (norm['priority'] || 'normal').toLowerCase();
          const rawFreq = norm['frequencytype'] || norm['frequency'] || norm['recurrence'] || '';
          const rawWeekdays = norm['weekdays'] || norm['days'] || norm['daysofweek'] || '';
          const rawWeekOfMonth = norm['weekofmonth'] || norm['monthweek'] || norm['week'] || '';

          const rowNum = index + 2; // 1-indexed + header row
          const errors: string[] = [];

          if (!rawTitle) {
            errors.push('Missing Title');
          } else if (rawTitle.length > 300) {
            errors.push('Title exceeds 300 characters');
          }

          const matchedMember = resolveMember(rawAssignee);
          if (!rawAssignee) {
            errors.push('Missing Assignee');
          } else if (!matchedMember) {
            errors.push(`Unknown assignee "${rawAssignee}"`);
          }

          const freqType = normalizeFrequencyType(rawFreq);
          if (!rawFreq) {
            errors.push('Missing Frequency Type');
          } else if (!freqType) {
            errors.push(`Invalid Frequency Type "${rawFreq}" (use daily, weekdays, or month_week)`);
          }

          const priority: 'normal' | 'high' = rawPriority === 'high' ? 'high' : 'normal';
          if (rawPriority && rawPriority !== 'normal' && rawPriority !== 'high') {
            errors.push(`Invalid Priority "${rawPriority}" (use normal or high)`);
          }

          let recurrence: RecurrenceRule = { type: freqType || 'daily' };

          if (freqType === 'weekdays') {
            const { days, invalidTokens } = parseWeekdaysString(rawWeekdays);
            if (invalidTokens.length > 0) {
              errors.push(`Unrecognized weekday(s): ${invalidTokens.join(', ')}`);
            } else if (days.length === 0) {
              errors.push('Weekdays required when Frequency Type is weekdays');
            }
            recurrence = { type: 'weekdays', daysOfWeek: days };
          } else if (freqType === 'month_week') {
            const wk = parseInt(rawWeekOfMonth, 10);
            if (isNaN(wk) || wk < 1 || wk > 5) {
              errors.push('Week of Month must be 1–5 for month_week');
            }
            const { days, invalidTokens } = parseWeekdaysString(rawWeekdays);
            if (invalidTokens.length > 0) {
              errors.push(`Unrecognized weekday(s): ${invalidTokens.join(', ')}`);
            }
            recurrence = {
              type: 'month_week',
              weekOfMonth: isNaN(wk) ? 1 : wk,
              daysOfWeek: days.length > 0 ? days : undefined,
            };
          }

          if (errors.length > 0 || !matchedMember || !freqType) {
            return {
              rowNum,
              valid: false,
              error: errors.join('; '),
              rawTitle: rawTitle || '(Empty)',
              rawAssignee: rawAssignee || '(Empty)',
            };
          }

          return {
            rowNum,
            valid: true,
            assigneeName: matchedMember.name,
            rawTitle,
            rawAssignee,
            taskInput: {
              title: rawTitle.slice(0, 300),
              description: rawDesc.slice(0, 2000),
              assigneeId: matchedMember.id,
              category: rawCategory.slice(0, 100) || 'Operations',
              priority,
              recurrence,
            },
          };
        });

        setParsedRows(results);
      } catch (err) {
        console.error('Excel parse error:', err);
        setParseError('Could not read this file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
        setParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validTasks = parsedRows
    .filter((r) => r.valid && r.taskInput)
    .map((r) => r.taskInput!);
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  const handleImport = async () => {
    if (validTasks.length === 0) return;
    setIsImporting(true);
    setParseError('');

    try {
      const count = await addMultipleTasks(validTasks);
      setImportSuccess(`Successfully imported ${count} task${count === 1 ? '' : 's'} for your team!`);
      setParsedRows([]);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setParseError('Failed to save tasks to Firestore. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Add Multiple Tasks via Excel
              </h2>
              <p className="text-xs text-slate-500">
                Download the Excel template, populate tasks for multiple teammates, and upload it back.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {importSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{importSuccess}</span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Two-step workflow cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1: Download Template */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Step 1
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Download Excel Template
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Includes formatted columns, sample rows, and a second sheet listing all active team members and recurrence rules.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download Template (.xlsx)</span>
              </button>
            </div>

            {/* Step 2: Upload Populated Excel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Step 2
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Upload Populated File
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Select your completed <span className="font-mono">.xlsx</span>, <span className="font-mono">.xls</span>, or <span className="font-mono">.csv</span> file to preview and validate rows before saving.
                </p>
              </div>

              <label className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">
                  {fileName ? `Loaded: ${fileName}` : 'Choose Excel File to Upload'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-900">
                    Preview ({parsedRows.length} rows)
                  </span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    {validTasks.length} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-600 font-semibold font-mono">
                      {invalidCount} with errors (skipped)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-12">Row</th>
                      <th className="py-2 px-3">Task Title</th>
                      <th className="py-2 px-3">Assignee</th>
                      <th className="py-2 px-3">Schedule</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNum}
                        className={row.valid ? 'bg-white' : 'bg-rose-50/50'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-400">
                          {row.rowNum}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                          {row.rawTitle}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {row.valid ? row.assigneeName : row.rawAssignee}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          {row.valid && row.taskInput
                            ? getRecurrenceLabel(row.taskInput.recurrence)
                            : '—'}
                        </td>
                        <td className="py-2 px-3">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Ready
                            </span>
                          ) : (
                            <span className="text-rose-700 text-[11px]">
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">
            {members.length} active team member{members.length === 1 ? '' : 's'} available for assignment
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={validTasks.length === 0 || isImporting}
              onClick={handleImport}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isImporting
                ? 'Uploading to Cloud...'
                : `Import ${validTasks.length} Task${validTasks.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
