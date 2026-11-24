import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import type { CategoryItem, Task, TaskFormValues } from '../types/task';

interface TasksContextValue {
  tasks: Task[];
  categories: CategoryItem[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTask: (values: TaskFormValues) => Promise<Task>;
  editTask: (id: string, updates: Partial<TaskFormValues>, silent?: boolean) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
  bulkRemoveTasks: (ids: string[]) => Promise<void>;
  clearCompleted: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<CategoryItem>;
  removeCategory: (id: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setCategories([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [fetchedTasks, fetchedCategories] = await Promise.all([
        api.getTasks(),
        api.getCategories(),
      ]);
      setTasks(fetchedTasks);
      setCategories(fetchedCategories);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const addTask = async (values: TaskFormValues) => {
    const created = await api.createTask(values);
    setTasks((prev) => [created, ...prev]);
    toast.success('Task created');
    return created;
  };

  const editTask = async (id: string, updates: Partial<TaskFormValues>, silent = false) => {
    const updated = await api.updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    if (!silent) {
      toast.success('Task updated');
    }
    return updated;
  };

  const removeTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Task deleted');
  };

  const bulkRemoveTasks = async (ids: string[]) => {
    const { deletedCount } = await api.bulkDeleteTasks(ids);
    const idSet = new Set(ids);
    setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
    toast.success(`Deleted ${deletedCount} ${deletedCount === 1 ? 'task' : 'tasks'}`);
  };

  const clearCompleted = async () => {
    const { deletedCount } = await api.clearCompletedTasks();
    setTasks((prev) => prev.filter((t) => t.status !== 'Completed'));
    toast.success(
      deletedCount > 0
        ? `Cleared ${deletedCount} completed ${deletedCount === 1 ? 'task' : 'tasks'}`
        : 'No completed tasks to clear'
    );
  };

  const addCategory = async (name: string, color: string) => {
    const created = await api.createCategory(name, color);
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`Category "${created.name}" created`);
    return created;
  };

  const removeCategory = async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success('Category removed');
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        categories,
        loading,
        error,
        refreshTasks,
        addTask,
        editTask,
        removeTask,
        bulkRemoveTasks,
        clearCompleted,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return ctx;
}
