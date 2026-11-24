export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  isImportant: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  isImportant: boolean;
  tags: string[];
}

export interface CategoryItem {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  themePreference: 'light' | 'dark';
  createdAt: string;
}

export type SortField = 'created_desc' | 'created_asc' | 'due_asc' | 'due_desc';

export type TaskScope =
  | 'all'
  | 'today'
  | 'upcoming'
  | 'important'
  | 'in-progress'
  | 'completed';

export const DEFAULT_CATEGORY_PRESETS: Array<{ name: string; color: string }> = [
  { name: 'Personal', color: '#2563EB' },
  { name: 'Work', color: '#0F766E' },
  { name: 'Engineering', color: '#4F46E5' },
  { name: 'Design', color: '#B45309' },
  { name: 'Health', color: '#16A34A' },
  { name: 'Finance', color: '#DC2626' },
];
