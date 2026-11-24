import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useTasks } from '../contexts/TasksContext';
import { DEFAULT_CATEGORY_PRESETS, type CategoryItem } from '../types/task';
import { ConfirmDialog } from '../components/ConfirmDialog';

const COLOR_OPTIONS = [
  '#2563EB',
  '#0F766E',
  '#4F46E5',
  '#B45309',
  '#16A34A',
  '#DC2626',
  '#7C3AED',
  '#0284C7',
];

export function CategoriesPage() {
  const { tasks, categories, addCategory, removeCategory } = useTasks();
  const navigate = useNavigate();

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2563EB');
  const [submitting, setSubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const combinedCategories = useMemo(() => {
    const map = new Map<
      string,
      { name: string; color: string; customRecord?: CategoryItem }
    >();

    DEFAULT_CATEGORY_PRESETS.forEach((preset) => {
      map.set(preset.name.toLowerCase(), {
        name: preset.name,
        color: preset.color,
      });
    });

    categories.forEach((cat) => {
      map.set(cat.name.toLowerCase(), {
        name: cat.name,
        color: cat.color,
        customRecord: cat,
      });
    });

    tasks.forEach((task) => {
      const catName = task.category || 'Personal';
      if (!map.has(catName.toLowerCase())) {
        map.set(catName.toLowerCase(), {
          name: catName,
          color: '#64748B',
        });
      }
    });

    return Array.from(map.values()).map((entry) => {
      const matchingTasks = tasks.filter(
        (t) => t.category.toLowerCase() === entry.name.toLowerCase()
      );
      const completed = matchingTasks.filter((t) => t.status === 'Completed').length;
      return {
        ...entry,
        total: matchingTasks.length,
        completed,
        pending: matchingTasks.length - completed,
      };
    });
  }, [categories, tasks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await addCategory(trimmed, newColor);
      setNewName('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await removeCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Categories</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Organize tasks into workstreams and inspect completion progress per category.
        </p>
      </div>

      {/* Add Custom Category */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-end gap-4"
      >
        <div className="flex-1">
          <label
            htmlFor="new-category-name"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            New Custom Category
          </label>
          <input
            id="new-category-name"
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Product Launch, Study, Travel"
            className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Color Swatch
          </span>
          <div className="flex items-center gap-1.5 h-9">
            {COLOR_OPTIONS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setNewColor(hex)}
                aria-label={`Select color ${hex}`}
                style={{ backgroundColor: hex }}
                className={`w-6 h-6 rounded-md transition-transform ${
                  newColor === hex
                    ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900 scale-110'
                    : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !newName.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </form>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {combinedCategories.map((cat) => {
          const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
          return (
            <div
              key={cat.name}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-xs shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {cat.name}
                  </h3>
                </div>

                {cat.customRecord && (
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(cat.customRecord!)}
                    aria-label={`Delete category ${cat.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {cat.total}
                    </strong>{' '}
                    {cat.total === 1 ? 'task' : 'tasks'}
                  </span>
                  <span className="font-mono tabular-nums">{pct}% complete</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {cat.pending} active · {cat.completed} done
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/tasks?category=${encodeURIComponent(cat.name)}`)
                  }
                  className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                >
                  Open
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Remove custom category?"
        description={
          categoryToDelete
            ? `Remove "${categoryToDelete.name}" from your custom categories? Existing tasks keeping this label will not be deleted.`
            : ''
        }
        confirmLabel="Remove Category"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
