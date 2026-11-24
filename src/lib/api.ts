import { auth } from './firebase';
import type { CategoryItem, Task, TaskFormValues, UserProfile } from '../types/task';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // keep default errorMessage
    }
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getProfile: () => request<UserProfile>('/api/me'),

  updateProfile: (payload: { themePreference?: 'light' | 'dark'; displayName?: string | null }) =>
    request<UserProfile>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getTasks: () => request<Task[]>('/api/tasks'),

  createTask: (values: TaskFormValues) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...values,
        dueDate: values.dueDate || null,
        dueTime: values.dueTime || null,
      }),
    }),

  updateTask: (id: string, updates: Partial<TaskFormValues>) =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate || null } : {}),
        ...(updates.dueTime !== undefined ? { dueTime: updates.dueTime || null } : {}),
      }),
    }),

  deleteTask: (id: string) =>
    request<{ ok: boolean }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),

  bulkDeleteTasks: (ids: string[]) =>
    request<{ deletedCount: number }>('/api/tasks/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  clearCompletedTasks: () =>
    request<{ deletedCount: number }>('/api/tasks/clear-completed', {
      method: 'POST',
    }),

  getCategories: () => request<CategoryItem[]>('/api/categories'),

  createCategory: (name: string, color: string) =>
    request<CategoryItem>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),

  deleteCategory: (id: string) =>
    request<{ ok: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
};
