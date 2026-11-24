import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { useTasks } from '../contexts/TasksContext';
import type { Task, TaskStatus } from '../types/task';
import {
  computeDashboardStats,
  computeWeeklyProductivity,
  isTaskDueToday,
  isTaskUpcoming,
} from '../utils/taskHelpers';
import { WeeklyChart } from '../components/WeeklyChart';
import { TaskRow } from '../components/TaskRow';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DashboardPageProps {
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
}

export function DashboardPage({ onOpenNewTask, onEditTask }: DashboardPageProps) {
  const { tasks, loading, error, refreshTasks, editTask, removeTask } = useTasks();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => computeDashboardStats(tasks), [tasks]);
  const weeklyData = useMemo(() => computeWeeklyProductivity(tasks), [tasks]);

  const todaysTasks = useMemo(
    () => tasks.filter((t) => isTaskDueToday(t)).slice(0, 5),
    [tasks]
  );

  const upcomingDeadlines = useMemo(
    () =>
      tasks
        .filter((t) => isTaskUpcoming(t) && !isTaskDueToday(t))
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
        .slice(0, 5),
    [tasks]
  );

  const importantTasks = useMemo(
    () => tasks.filter((t) => t.isImportant && t.status !== 'Completed').slice(0, 5),
    [tasks]
  );

  const recentTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    await editTask(task.id, { status: nextStatus });
  };

  const handleToggleImportant = async (task: Task) => {
    await editTask(task.id, { isImportant: !task.isImportant });
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await removeTask(taskToDelete.id);
      setTaskToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={refreshTasks}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          Retry Loading Tasks
        </button>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tasks', value: stats.total, tone: 'text-slate-900 dark:text-slate-100' },
    { label: 'Completed', value: stats.completed, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Pending', value: stats.pending, tone: 'text-slate-700 dark:text-slate-300' },
    { label: 'In Progress', value: stats.inProgress, tone: 'text-blue-600 dark:text-blue-400' },
    { label: 'Overdue', value: stats.overdue, tone: 'text-red-600 dark:text-red-400' },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      tone: 'text-slate-900 dark:text-slate-100',
      showBar: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Metrics Row */}
      <section aria-label="Task metrics overview">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${card.tone}`}>
                {card.value}
              </p>
              {card.showBar && (
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {tasks.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Your workspace is ready
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Create your first task to track deadlines, organize categories, and measure your weekly completion rate.
          </p>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Task
          </button>
        </div>
      ) : (
        <>
          {/* Weekly Productivity Chart */}
          <WeeklyChart data={weeklyData} />

          {/* Actionable Task Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaskSectionCard
              title="Today's Tasks"
              subtitle="Scheduled for today"
              linkTo="/my-day"
              tasks={todaysTasks}
              emptyText="No tasks scheduled for today."
              onToggleComplete={handleToggleComplete}
              onToggleImportant={handleToggleImportant}
              onEdit={onEditTask}
              onRequestDelete={setTaskToDelete}
            />

            <TaskSectionCard
              title="Upcoming Deadlines"
              subtitle="Next scheduled deliverables"
              linkTo="/upcoming"
              tasks={upcomingDeadlines}
              emptyText="No upcoming deadlines ahead."
              onToggleComplete={handleToggleComplete}
              onToggleImportant={handleToggleImportant}
              onEdit={onEditTask}
              onRequestDelete={setTaskToDelete}
            />

            <TaskSectionCard
              title="Important Tasks"
              subtitle="Starred high-focus items"
              linkTo="/important"
              tasks={importantTasks}
              emptyText="No starred active tasks."
              onToggleComplete={handleToggleComplete}
              onToggleImportant={handleToggleImportant}
              onEdit={onEditTask}
              onRequestDelete={setTaskToDelete}
            />

            <TaskSectionCard
              title="Recent Tasks"
              subtitle="Most recently added"
              linkTo="/tasks"
              tasks={recentTasks}
              emptyText="No recent tasks yet."
              onToggleComplete={handleToggleComplete}
              onToggleImportant={handleToggleImportant}
              onEdit={onEditTask}
              onRequestDelete={setTaskToDelete}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task?"
        description={
          taskToDelete
            ? `Are you sure you want to permanently delete "${taskToDelete.title}"? This action cannot be undone.`
            : ''
        }
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

interface TaskSectionCardProps {
  title: string;
  subtitle: string;
  linkTo: string;
  tasks: Task[];
  emptyText: string;
  onToggleComplete: (task: Task) => void;
  onToggleImportant: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

function TaskSectionCard({
  title,
  subtitle,
  linkTo,
  tasks,
  emptyText,
  onToggleComplete,
  onToggleImportant,
  onEdit,
  onRequestDelete,
}: TaskSectionCardProps) {
  return (
    <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400 text-center">
          {emptyText}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onToggleImportant={onToggleImportant}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
