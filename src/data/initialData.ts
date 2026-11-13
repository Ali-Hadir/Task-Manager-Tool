import { Task, TeamMember, TaskCompletionRecord, UserAccount } from '../types';
import { formatDateKey } from '../utils/dateUtils';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    role: 'Operations & Workspace Admin',
    status: 'approved',
    isAdmin: true,
    memberId: 'member-1',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'user-alex',
    username: 'alex',
    password: 'alex123',
    name: 'Alex Chen',
    role: 'Operations Lead',
    status: 'approved',
    isAdmin: false,
    memberId: 'member-1',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'user-sarah',
    username: 'sarah',
    password: 'sarah123',
    name: 'Sarah Jenkins',
    role: 'Client Success Manager',
    status: 'approved',
    isAdmin: false,
    memberId: 'member-2',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'user-elena',
    username: 'elena',
    password: 'elena123',
    name: 'Elena Rostova',
    role: 'Finance & Compliance',
    status: 'approved',
    isAdmin: false,
    memberId: 'member-3',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'user-marcus',
    username: 'marcus',
    password: 'marcus123',
    name: 'Marcus Vance',
    role: 'Systems & Infrastructure',
    status: 'approved',
    isAdmin: false,
    memberId: 'member-4',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'user-demo-pending',
    username: 'david',
    password: 'david123',
    name: 'David Kim',
    role: 'Junior Auditor',
    status: 'pending',
    isAdmin: false,
    memberId: 'member-pending',
    createdAt: '2026-11-10T04:00:00Z',
  },
];

export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Alex Chen',
    role: 'Operations Lead',
    email: 'alex.chen@team.internal',
    initials: 'AC',
    color: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
  },
  {
    id: 'member-2',
    name: 'Sarah Jenkins',
    role: 'Client Success Manager',
    email: 'sarah.j@team.internal',
    initials: 'SJ',
    color: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
  },
  {
    id: 'member-3',
    name: 'Elena Rostova',
    role: 'Finance & Compliance',
    email: 'elena.r@team.internal',
    initials: 'ER',
    color: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
  },
  {
    id: 'member-4',
    name: 'Marcus Vance',
    role: 'Systems & Infrastructure',
    email: 'marcus.v@team.internal',
    initials: 'MV',
    color: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
  },
];

export const INITIAL_TASKS: Task[] = [
  // 5 Everyday Tasks (checked on an everyday basis)
  {
    id: 'task-1',
    title: 'Daily Standup & Operational Blocker Review',
    description: 'Sync with team leads on daily blockers, high-priority dispatches, and urgent escalations.',
    assigneeId: 'member-1',
    category: 'Operations',
    priority: 'high',
    recurrence: {
      type: 'daily',
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-2',
    title: 'System Health & Server Heartbeat Verification',
    description: 'Monitor cloud node health, database connection latency, and API error rates.',
    assigneeId: 'member-4',
    category: 'Infrastructure',
    priority: 'high',
    recurrence: {
      type: 'daily',
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Customer Priority Support & Inbox Zero Check',
    description: 'Review critical pending customer tickets and clear incoming tier-1 inquiries.',
    assigneeId: 'member-2',
    category: 'Client Support',
    priority: 'normal',
    recurrence: {
      type: 'daily',
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Daily Cash Settlement & Ledger Balance Check',
    description: 'Verify payment gateway batches, match daily inflows, and flag discrepancies.',
    assigneeId: 'member-3',
    category: 'Finance',
    priority: 'high',
    recurrence: {
      type: 'daily',
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Warehouse Dispatch & Shipment Manifest Log',
    description: 'Verify order dispatch queues and cross-check tracking numbers with logistics partners.',
    assigneeId: 'member-1',
    category: 'Logistics',
    priority: 'normal',
    recurrence: {
      type: 'daily',
    },
    createdAt: '2026-10-01T08:00:00Z',
  },

  // 5 Specific Days of the Week Tasks
  {
    id: 'task-6',
    title: 'Monday Sprint Kickoff & Milestone Allocation',
    description: 'Review weekly deliverables, assign sprint tasks, and align on weekly targets.',
    assigneeId: 'member-1',
    category: 'Operations',
    priority: 'high',
    recurrence: {
      type: 'weekdays',
      daysOfWeek: [1], // Monday
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-7',
    title: 'Tuesday Vendor Invoices & Tax Receipts Audit',
    description: 'Review pending supplier invoices, approve purchase requisitions, and record tax receipts.',
    assigneeId: 'member-3',
    category: 'Finance',
    priority: 'normal',
    recurrence: {
      type: 'weekdays',
      daysOfWeek: [2], // Tuesday
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-8',
    title: 'Wednesday Client SLA Compliance & Feedback Review',
    description: 'Audit ticket response times against customer SLAs and review client satisfaction survey scores.',
    assigneeId: 'member-2',
    category: 'Client Support',
    priority: 'normal',
    recurrence: {
      type: 'weekdays',
      daysOfWeek: [3], // Wednesday
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-9',
    title: 'Thursday Infrastructure Backup & Security Patch Dry-Run',
    description: 'Run automated backup verification and test server snapshot restoration in staging.',
    assigneeId: 'member-4',
    category: 'Infrastructure',
    priority: 'high',
    recurrence: {
      type: 'weekdays',
      daysOfWeek: [4], // Thursday
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-10',
    title: 'Friday Team Weekly Retrospective & Goal Wrap-Up',
    description: 'Publish the weekly completion metrics, celebrate wins, and note areas of improvement.',
    assigneeId: 'member-1',
    category: 'Operations',
    priority: 'normal',
    recurrence: {
      type: 'weekdays',
      daysOfWeek: [5], // Friday
    },
    createdAt: '2026-10-01T08:00:00Z',
  },

  // Week of the Month Specific Tasks
  {
    id: 'task-11',
    title: 'Week 1 Financial Close & Payroll Preparation',
    description: 'Consolidate month-start accounts, review timesheets, and prepare preliminary payroll runs.',
    assigneeId: 'member-3',
    category: 'Finance',
    priority: 'high',
    recurrence: {
      type: 'month_week',
      weekOfMonth: 1, // First week of month
      daysOfWeek: [1, 2], // Mon & Tue of Week 1
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-12',
    title: 'Week 2 Hardware Asset Audit & Maintenance Check',
    description: 'Physical equipment verification, UPS battery testing, and cooling unit inspections.',
    assigneeId: 'member-4',
    category: 'Infrastructure',
    priority: 'normal',
    recurrence: {
      type: 'month_week',
      weekOfMonth: 2, // Second week of month
      daysOfWeek: [2, 4], // Tue & Thu of Week 2
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
];

/**
 * Generate sample completion records around the current date for instant report demo
 */
export function generateInitialCompletions(today: Date): Record<string, TaskCompletionRecord> {
  const records: Record<string, TaskCompletionRecord> = {};
  
  // Create sample completions for the past 7 days to showcase weekly report immediately
  for (let offset = -7; offset <= 0; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dateKey = formatDateKey(d);

    INITIAL_TASKS.forEach((task) => {
      // Complete all tasks for previous days with 90% probability, and some for today
      const isPast = offset < 0;
      const shouldComplete = isPast ? Math.random() > 0.12 : Math.random() > 0.4;
      
      if (shouldComplete) {
        records[`${dateKey}_${task.id}`] = {
          taskId: task.id,
          date: dateKey,
          completed: true,
          completedAt: new Date(d.getTime() + 1000 * 60 * 60 * 10).toISOString(),
          completedBy: task.assigneeId,
        };
      }
    });
  }

  return records;
}
