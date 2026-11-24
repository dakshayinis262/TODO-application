import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Plus, Search, Trash2, X } from 'lucide-react';
import { useTasks } from '../contexts/TasksContext';
import {
  DEFAULT_CATEGORY_PRESETS,
  type SortField,
  type Task,
  type TaskPriority,
  type TaskScope,
  type TaskStatus,
} from '../types/task';
import { isTaskDueToday, isTaskUpcoming } from '../utils/taskHelpers';
import { TaskRow } from '../components/TaskRow';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface TasksViewPageProps {
  scope: TaskScope;
  title: string;
  description: string;
  onOpenNewTask: (defaults?: {
    category?: string;
    dueDate?: string;
    isImportant?: boolean;
  }) => void;
  onEditTask: (task: Task) => void;
}

export function TasksViewPage({
  scope,
  title,
  description,
  onOpenNewTask,
  onEditTask,
}: TasksViewPageProps) {
  const { tasks, categories, loading, editTask, removeTask, bulkRemoveTasks, clearCompleted } =
    useTasks();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>(
    () => searchParams.get('category') || 'All'
  );
  const [sortBy, setSortBy] = useState<SortField>('created_desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [confirmMode, setConfirmMode] = useState<
    | { type: 'single'; task: Task }
    | { type: 'bulk'; ids: string[] }
    | { type: 'clearCompleted' }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat) {
      setCategoryFilter(paramCat);
    }
  }, [searchParams]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [scope]);

  const allCategoryNames = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORY_PRESETS.map((c) => c.name));
    categories.forEach((c) => set.add(c.name));
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, tasks]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const scoped = tasks.filter((task) => {
      if (scope === 'today' && !isTaskDueToday(task)) return false;
      if (scope === 'upcoming' && !isTaskUpcoming(task)) return false;
      if (scope === 'important' && !task.isImportant) return false;
      if (scope === 'in-progress' && task.status !== 'In Progress') return false;
      if (scope === 'completed' && task.status !== 'Completed') return false;

      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && task.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && task.category !== categoryFilter) return false;

      if (query) {
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        const matchesTags = task.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });

    return scoped.sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'created_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'due_asc') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      // due_desc
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return b.dueDate.localeCompare(a.dueDate);
    });
  }, [tasks, scope, searchQuery, priorityFilter, statusFilter, categoryFilter, sortBy]);

  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'Completed').length,
    [tasks]
  );

  const visibleSelectedCount = useMemo(
    () => filteredTasks.filter((t) => selectedIds.has(t.id)).length,
    [filteredTasks, selectedIds]
  );

  const allVisibleSelected =
    filteredTasks.length > 0 && visibleSelectedCount === filteredTasks.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    await editTask(task.id, { status: nextStatus });
  };

  const handleToggleImportant = async (task: Task) => {
    await editTask(task.id, { isImportant: !task.isImportant });
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    await editTask(task.id, { status });
  };

  const handleConfirmDelete = async () => {
    if (!confirmMode) return;
    setDeleting(true);
    try {
      if (confirmMode.type === 'single') {
        await removeTask(confirmMode.task.id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(confirmMode.task.id);
          return next;
        });
      } else if (confirmMode.type === 'bulk') {
        await bulkRemoveTasks(confirmMode.ids);
        setSelectedIds(new Set());
      } else if (confirmMode.type === 'clearCompleted') {
        await clearCompleted();
        setSelectedIds(new Set());
      }
      setConfirmMode(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setStatusFilter('All');
    setCategoryFilter('All');
    if (searchParams.has('category')) {
      setSearchParams({});
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'All' ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All';

  const getNewTaskDefaults = () => {
    const defaults: { category?: string; dueDate?: string; isImportant?: boolean } = {};
    if (categoryFilter !== 'All') defaults.category = categoryFilter;
    if (scope === 'today') {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      defaults.dueDate = `${yyyy}-${mm}-${dd}`;
    }
    if (scope === 'important') defaults.isImportant = true;
    return defaults;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {visibleSelectedCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setConfirmMode({
                  type: 'bulk',
                  ids: filteredTasks.filter((t) => selectedIds.has(t.id)).map((t) => t.id),
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({visibleSelectedCount})
            </button>
          )}

          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => setConfirmMode({ type: 'clearCompleted' })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 transition-colors whitespace-nowrap shrink-0"
            >
              Clear Completed ({completedCount})
            </button>
          )}
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, description, or tag..."
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'All' | TaskPriority)}
              aria-label="Filter by priority"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                const val = e.target.value;
                setCategoryFilter(val);
                if (val === 'All' && searchParams.has('category')) {
                  setSearchParams({});
                }
              }}
              aria-label="Filter by category"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Categories</option>
              {allCategoryNames.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {scope !== 'in-progress' && scope !== 'completed' && (
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | TaskStatus)}
                aria-label="Filter by status"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                disabled={filteredTasks.length === 0}
                onChange={toggleSelectAllVisible}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600"
              />
              <span>Select all ({filteredTasks.length})</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <X className="w-3.5 h-3.5" />
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              aria-label="Sort tasks"
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="created_desc">Newest created</option>
              <option value="created_asc">Oldest created</option>
              <option value="due_asc">Due date (earliest)</option>
              <option value="due_desc">Due date (latest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && tasks.length === 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 px-4 py-3 animate-pulse bg-slate-50/40 dark:bg-slate-900" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {hasActiveFilters ? 'No tasks match your filters' : 'No tasks in this view yet'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hasActiveFilters
                ? 'Try clearing your search query or adjusting the priority, status, or category filter.'
                : 'Add a task here to get started.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenNewTask(getNewTaskDefaults())}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                showSelectCheckbox
                selected={selectedIds.has(task.id)}
                onToggleSelect={toggleSelect}
                onToggleComplete={handleToggleComplete}
                onToggleImportant={handleToggleImportant}
                onStatusChange={handleStatusChange}
                onEdit={onEditTask}
                onRequestDelete={(t) => setConfirmMode({ type: 'single', task: t })}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmMode)}
        title={
          confirmMode?.type === 'bulk'
            ? `Delete ${confirmMode.ids.length} selected tasks?`
            : confirmMode?.type === 'clearCompleted'
              ? `Clear ${completedCount} completed tasks?`
              : 'Delete task?'
        }
        description={
          confirmMode?.type === 'bulk'
            ? `You are about to permanently delete ${confirmMode.ids.length} selected tasks. This cannot be undone.`
            : confirmMode?.type === 'clearCompleted'
              ? `You are about to permanently remove all ${completedCount} completed tasks from your workspace.`
              : confirmMode?.type === 'single'
                ? `Are you sure you want to permanently delete "${confirmMode.task.title}"? This action cannot be undone.`
                : ''
        }
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmMode(null)}
      />
    </div>
  );
}
