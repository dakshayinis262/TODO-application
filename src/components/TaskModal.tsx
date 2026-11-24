import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Star, X } from 'lucide-react';
import {
  DEFAULT_CATEGORY_PRESETS,
  type Task,
  type TaskFormValues,
  type TaskPriority,
  type TaskStatus,
} from '../types/task';
import { useTasks } from '../contexts/TasksContext';

interface TaskModalProps {
  open: boolean;
  initialTask?: Task | null;
  defaultScopeCategory?: string;
  defaultDueDate?: string;
  defaultImportant?: boolean;
  onClose: () => void;
  onSave: (values: TaskFormValues, existingId?: string) => Promise<void>;
}

export function TaskModal({
  open,
  initialTask,
  defaultScopeCategory,
  defaultDueDate,
  defaultImportant,
  onClose,
  onSave,
}: TaskModalProps) {
  const { categories } = useTasks();

  const availableCategories = useMemo(() => {
    const names = new Set<string>(DEFAULT_CATEGORY_PRESETS.map((c) => c.name));
    categories.forEach((c) => names.add(c.name));
    if (initialTask?.category) names.add(initialTask.category);
    if (defaultScopeCategory) names.add(defaultScopeCategory);
    return Array.from(names);
  }, [categories, initialTask, defaultScopeCategory]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState('Personal');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [isImportant, setIsImportant] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description ?? '');
      setDueDate(initialTask.dueDate ?? '');
      setDueTime(initialTask.dueTime ? initialTask.dueTime.slice(0, 5) : '');
      setPriority(initialTask.priority);
      setCategory(initialTask.category || 'Personal');
      setStatus(initialTask.status);
      setIsImportant(initialTask.isImportant);
      setTags(initialTask.tags ?? []);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(defaultDueDate ?? '');
      setDueTime('');
      setPriority('Medium');
      setCategory(defaultScopeCategory || 'Personal');
      setStatus('Pending');
      setIsImportant(Boolean(defaultImportant));
      setTags([]);
    }
    setTagInput('');
    setFormError(null);
  }, [open, initialTask, defaultScopeCategory, defaultDueDate, defaultImportant]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const addTagFromInput = () => {
    const cleaned = tagInput.trim().replace(/^#/, '').slice(0, 32);
    if (!cleaned) return;
    if (!tags.includes(cleaned) && tags.length < 15) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a task title.');
      return;
    }

    const finalTags = [...tags];
    const trailingTag = tagInput.trim().replace(/^#/, '').slice(0, 32);
    if (trailingTag && !finalTags.includes(trailingTag) && finalTags.length < 15) {
      finalTags.push(trailingTag);
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          dueDate,
          dueTime,
          priority,
          category,
          status,
          isImportant,
          tags: finalTags,
        },
        initialTask?.id
      );
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="task-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finalize Q4 product roadmap"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, acceptance criteria, or context..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="task-due-time"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Due Time
              </label>
              <input
                id="task-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-category"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="task-tags"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tags
            </label>
            <div className="flex items-center gap-2">
              <input
                id="task-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
                className="flex-1 px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={addTagFromInput}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 font-mono">
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsImportant((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
                isImportant
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Star className={`w-4 h-4 ${isImportant ? 'fill-amber-500 text-amber-500' : ''}`} />
              {isImportant ? 'Marked as Important' : 'Mark as Important'}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {submitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
