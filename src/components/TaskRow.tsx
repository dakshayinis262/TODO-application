import { Check, Pencil, Star, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '../types/task';
import { formatDueDateLabel, isTaskOverdue } from '../utils/taskHelpers';

interface TaskRowProps {
  task: Task;
  selected?: boolean;
  showSelectCheckbox?: boolean;
  onToggleSelect?: (id: string) => void;
  onToggleComplete: (task: Task) => void;
  onToggleImportant: (task: Task) => void;
  onStatusChange?: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

export function TaskRow({
  task,
  selected = false,
  showSelectCheckbox = false,
  onToggleSelect,
  onToggleComplete,
  onToggleImportant,
  onStatusChange,
  onEdit,
  onRequestDelete,
}: TaskRowProps) {
  const overdue = isTaskOverdue(task);
  const dueLabel = formatDueDateLabel(task.dueDate, task.dueTime);
  const isCompleted = task.status === 'Completed';

  const priorityClass =
    task.priority === 'High'
      ? 'text-red-600 dark:text-red-400 font-medium'
      : task.priority === 'Medium'
        ? 'text-amber-700 dark:text-amber-400 font-medium'
        : 'text-slate-500 dark:text-slate-400';

  const statusClass =
    task.status === 'Completed'
      ? 'text-emerald-700 dark:text-emerald-400'
      : task.status === 'In Progress'
        ? 'text-blue-700 dark:text-blue-400'
        : 'text-slate-500 dark:text-slate-400';

  return (
    <div className="group flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
      {showSelectCheckbox && onToggleSelect && (
        <div className="pt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(task.id)}
            aria-label={`Select ${task.title}`}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 cursor-pointer"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => onToggleComplete(task)}
        aria-label={isCompleted ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
          isCompleted
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-600 dark:hover:border-blue-400 text-transparent'
        }`}
      >
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="text-left min-w-0 flex-1 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
          >
            <p
              className={`text-sm font-medium leading-snug ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {task.description}
              </p>
            )}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {onStatusChange && (
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                aria-label={`Status for ${task.title}`}
                className="hidden sm:block text-xs px-2 py-1 rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => onToggleImportant(task)}
              aria-label={task.isImportant ? 'Remove importance' : 'Mark as important'}
              className={`p-1.5 rounded-lg transition-colors ${
                task.isImportant
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`w-4 h-4 ${task.isImportant ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onRequestDelete(task)}
              aria-label={`Delete ${task.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{task.category}</span>
          <span aria-hidden="true">·</span>
          <span className={priorityClass}>{task.priority} priority</span>
          <span aria-hidden="true">·</span>
          <span className={statusClass}>{task.status}</span>
          {dueLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span
                className={`font-mono tabular-nums ${
                  overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''
                }`}
              >
                {overdue ? `Overdue (${dueLabel})` : dueLabel}
              </span>
            </>
          )}
          {task.tags.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {task.tags.map((t) => `#${t}`).join(' ')}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
