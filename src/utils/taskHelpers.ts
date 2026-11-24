import {
  format,
  isAfter,
  isBefore,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';
import type { Task } from '../types/task';

export function getTodayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'Completed') return false;
  const due = parseISO(task.dueDate);
  const today = startOfDay(new Date());
  if (isBefore(due, today)) return true;
  if (isToday(due) && task.dueTime) {
    const nowTime = format(new Date(), 'HH:mm:ss');
    return task.dueTime < nowTime;
  }
  return false;
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  return isToday(parseISO(task.dueDate));
}

export function isTaskUpcoming(task: Task): boolean {
  if (!task.dueDate || task.status === 'Completed') return false;
  const due = parseISO(task.dueDate);
  const today = startOfDay(new Date());
  return isAfter(due, today) || isToday(due);
}

export function formatDueDateLabel(dueDate: string | null, dueTime: string | null): string | null {
  if (!dueDate) return null;
  const parsed = parseISO(dueDate);
  let dateLabel: string;
  if (isToday(parsed)) {
    dateLabel = 'Today';
  } else if (isTomorrow(parsed)) {
    dateLabel = 'Tomorrow';
  } else {
    dateLabel = format(parsed, 'MMM d, yyyy');
  }

  if (dueTime) {
    const [hours, minutes] = dueTime.split(':');
    const tempDate = new Date();
    tempDate.setHours(Number(hours), Number(minutes), 0, 0);
    return `${dateLabel} at ${format(tempDate, 'h:mm a')}`;
  }
  return dateLabel;
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export function computeDashboardStats(tasks: Task[]): DashboardStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const pending = tasks.filter((t) => t.status === 'Pending').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    inProgress,
    overdue,
    completionRate,
  };
}

export interface WeeklyChartDay {
  dateIso: string;
  dayLabel: string;
  fullDate: string;
  completedCount: number;
  createdCount: number;
}

export function computeWeeklyProductivity(tasks: Task[]): WeeklyChartDay[] {
  const days: WeeklyChartDay[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const dayDate = subDays(today, i);
    const dateIso = format(dayDate, 'yyyy-MM-dd');
    const dayLabel = format(dayDate, 'EEE');
    const fullDate = format(dayDate, 'MMM d');

    const createdCount = tasks.filter((t) => {
      const createdIso = format(new Date(t.createdAt), 'yyyy-MM-dd');
      return createdIso === dateIso;
    }).length;

    const completedCount = tasks.filter((t) => {
      if (t.status !== 'Completed') return false;
      const updatedIso = format(new Date(t.updatedAt), 'yyyy-MM-dd');
      return updatedIso === dateIso;
    }).length;

    days.push({
      dateIso,
      dayLabel,
      fullDate,
      completedCount,
      createdCount,
    });
  }

  return days;
}
