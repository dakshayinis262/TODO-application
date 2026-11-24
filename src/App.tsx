import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TasksProvider, useTasks } from './contexts/TasksContext';
import { AuthPage } from './components/AuthPage';
import { Layout } from './components/Layout';
import { TaskModal } from './components/TaskModal';
import { DashboardPage } from './pages/DashboardPage';
import { TasksViewPage } from './pages/TasksViewPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import type { Task, TaskFormValues } from './types/task';

function ProtectedWorkspace() {
  const { addTask, editTask } = useTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaults, setModalDefaults] = useState<{
    category?: string;
    dueDate?: string;
    isImportant?: boolean;
  }>({});

  const handleOpenNewTask = (defaults?: {
    category?: string;
    dueDate?: string;
    isImportant?: boolean;
  }) => {
    setEditingTask(null);
    setModalDefaults(defaults ?? {});
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setModalDefaults({});
    setModalOpen(true);
  };

  const handleSaveTask = async (values: TaskFormValues, existingId?: string) => {
    if (existingId) {
      await editTask(existingId, values);
    } else {
      await addTask(values);
    }
  };

  return (
    <Layout onOpenNewTask={() => handleOpenNewTask()}>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              onOpenNewTask={() => handleOpenNewTask()}
              onEditTask={handleEditTask}
            />
          }
        />
        <Route
          path="/tasks"
          element={
            <TasksViewPage
              scope="all"
              title="All Tasks"
              description="Every task in your workspace with full search, filtering, and sorting."
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          }
        />
        <Route
          path="/my-day"
          element={
            <TasksViewPage
              scope="today"
              title="My Day"
              description="Tasks scheduled for today."
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          }
        />
        <Route
          path="/upcoming"
          element={
            <TasksViewPage
              scope="upcoming"
              title="Upcoming"
              description="Active tasks with due dates today or ahead."
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          }
        />
        <Route
          path="/important"
          element={
            <TasksViewPage
              scope="important"
              title="Important"
              description="Starred tasks prioritized for focused execution."
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          }
        />
        <Route
          path="/in-progress"
          element={
            <TasksViewPage
              scope="in-progress"
              title="In Progress"
              description="Tasks actively being worked on right now."
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          }
        />
        <Route
          path="/completed"
          element={
            <TasksViewPage
              scope="completed"
              title="Completed"
              description="Finished tasks archived for reference or bulk cleanup."
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          }
        />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <TaskModal
        open={modalOpen}
        initialTask={editingTask}
        defaultScopeCategory={modalDefaults.category}
        defaultDueDate={modalDefaults.dueDate}
        defaultImportant={modalDefaults.isImportant}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
      />
    </Layout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading TaskFlow...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <TasksProvider>
      <ProtectedWorkspace />
    </TasksProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              className:
                'text-sm font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-lg',
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
