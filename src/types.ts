/**
 * Domain types for TaskFlow Minimalist Recurring Task Hub
 */

export type RecurrenceType = 'daily' | 'weekdays' | 'month_week';

export interface RecurrenceRule {
  type: RecurrenceType;
  /** Days of week: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday */
  daysOfWeek?: number[];
  /** Week of month: 1 = 1st week (days 1-7), 2 = 2nd week (days 8-14), 3 = 3rd week (days 15-21), 4 = 4th week (days 22-28), 5 = 5th week (days 29+) */
  weekOfMonth?: number;
  /** Optional verification window or preferred check time */
  targetTime?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  category: string;
  recurrence: RecurrenceRule;
  priority?: 'normal' | 'high';
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  initials: string;
  color: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface TaskCompletionRecord {
  taskId: string;
  date: string; // ISO Date string: YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export type UserStatus = 'approved' | 'pending' | 'rejected';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Plaintext for admin review as requested
  name: string;
  role: string;
  status: UserStatus;
  isAdmin: boolean;
  memberId: string; // Linked team member record
  createdAt: string;
}

export type ViewMode = 'individual' | 'team' | 'reports' | 'manage' | 'admin_users';
export type ReportMode = 'weekly' | 'monthly';
