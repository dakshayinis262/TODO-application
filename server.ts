import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, updateUserPreferences } from './src/db/users.ts';
import {
  bulkDeleteTasks,
  clearCompletedTasks,
  createTask,
  deleteTask,
  getTasksByUser,
  updateTask,
  type TaskPriority,
  type TaskStatus,
} from './src/db/tasks.ts';
import {
  createCategory,
  deleteCategory,
  getCategoriesByUser,
} from './src/db/categories.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

const VALID_PRIORITIES: readonly TaskPriority[] = ['High', 'Medium', 'Low'];
const VALID_STATUSES: readonly TaskStatus[] = ['Pending', 'In Progress', 'Completed'];

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const unique = new Set<string>();
  for (const raw of input) {
    if (typeof raw === 'string') {
      const cleaned = raw.trim().slice(0, 32);
      if (cleaned) unique.add(cleaned);
    }
    if (unique.size >= 15) break;
  }
  return Array.from(unique);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email ?? `${uid}@taskflow.local`;
      const profile = await getOrCreateUser(uid, email, req.user!.name ?? null);
      res.json(profile);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch user profile';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const { themePreference, displayName } = req.body ?? {};
      const updates: { themePreference?: 'light' | 'dark'; displayName?: string | null } = {};

      if (themePreference !== undefined) {
        if (themePreference !== 'light' && themePreference !== 'dark') {
          return res.status(400).json({ error: 'Invalid theme preference' });
        }
        updates.themePreference = themePreference;
      }

      if (displayName !== undefined) {
        if (displayName !== null && typeof displayName !== 'string') {
          return res.status(400).json({ error: 'Invalid display name' });
        }
        updates.displayName = displayName ? displayName.trim().slice(0, 80) : null;
      }

      const updated = await updateUserPreferences(uid, updates);
      if (!updated) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update preferences';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userTasks = await getTasksByUser(req.user!.uid);
      res.json(userTasks);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body ?? {};
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const title = body.title.trim().slice(0, 240);
      const description =
        typeof body.description === 'string' ? body.description.trim().slice(0, 4000) : '';

      let dueDate: string | null = null;
      if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '') {
        if (typeof body.dueDate !== 'string' || !DATE_REGEX.test(body.dueDate)) {
          return res.status(400).json({ error: 'Invalid due date format (expected YYYY-MM-DD)' });
        }
        dueDate = body.dueDate;
      }

      let dueTime: string | null = null;
      if (body.dueTime !== undefined && body.dueTime !== null && body.dueTime !== '') {
        if (typeof body.dueTime !== 'string' || !TIME_REGEX.test(body.dueTime)) {
          return res.status(400).json({ error: 'Invalid due time format (expected HH:MM)' });
        }
        dueTime = body.dueTime.length === 5 ? `${body.dueTime}:00` : body.dueTime;
      }

      const priority: TaskPriority = VALID_PRIORITIES.includes(body.priority)
        ? body.priority
        : 'Medium';
      const status: TaskStatus = VALID_STATUSES.includes(body.status) ? body.status : 'Pending';
      const category =
        typeof body.category === 'string' && body.category.trim()
          ? body.category.trim().slice(0, 60)
          : 'Personal';
      const isImportant = Boolean(body.isImportant);
      const tags = normalizeTags(body.tags);

      const created = await createTask(req.user!.uid, {
        title,
        description,
        dueDate,
        dueTime,
        priority,
        category,
        status,
        isImportant,
        tags,
      });

      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/tasks/bulk-delete', requireAuth, async (req: AuthRequest, res) => {
    try {
      const ids = req.body?.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide at least one task ID to delete' });
      }
      const validIds = ids.filter((id): id is string => typeof id === 'string' && UUID_REGEX.test(id));
      if (validIds.length !== ids.length) {
        return res.status(400).json({ error: 'One or more task IDs are invalid' });
      }

      const deletedCount = await bulkDeleteTasks(req.user!.uid, validIds);
      res.json({ deletedCount });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete selected tasks';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/tasks/clear-completed', requireAuth, async (req: AuthRequest, res) => {
    try {
      const deletedCount = await clearCompletedTasks(req.user!.uid);
      res.json({ deletedCount });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to clear completed tasks';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id ?? '');
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }

      const body = req.body ?? {};
      const updates: Parameters<typeof updateTask>[2] = {};

      if (body.title !== undefined) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
          return res.status(400).json({ error: 'Task title cannot be empty' });
        }
        updates.title = body.title.trim().slice(0, 240);
      }

      if (body.description !== undefined) {
        if (typeof body.description !== 'string') {
          return res.status(400).json({ error: 'Invalid description' });
        }
        updates.description = body.description.trim().slice(0, 4000);
      }

      if (body.dueDate !== undefined) {
        if (body.dueDate === null || body.dueDate === '') {
          updates.dueDate = null;
        } else if (typeof body.dueDate === 'string' && DATE_REGEX.test(body.dueDate)) {
          updates.dueDate = body.dueDate;
        } else {
          return res.status(400).json({ error: 'Invalid due date format' });
        }
      }

      if (body.dueTime !== undefined) {
        if (body.dueTime === null || body.dueTime === '') {
          updates.dueTime = null;
        } else if (typeof body.dueTime === 'string' && TIME_REGEX.test(body.dueTime)) {
          updates.dueTime = body.dueTime.length === 5 ? `${body.dueTime}:00` : body.dueTime;
        } else {
          return res.status(400).json({ error: 'Invalid due time format' });
        }
      }

      if (body.priority !== undefined) {
        if (!VALID_PRIORITIES.includes(body.priority)) {
          return res.status(400).json({ error: 'Invalid priority value' });
        }
        updates.priority = body.priority;
      }

      if (body.status !== undefined) {
        if (!VALID_STATUSES.includes(body.status)) {
          return res.status(400).json({ error: 'Invalid status value' });
        }
        updates.status = body.status;
      }

      if (body.category !== undefined) {
        if (typeof body.category !== 'string' || !body.category.trim()) {
          return res.status(400).json({ error: 'Category cannot be empty' });
        }
        updates.category = body.category.trim().slice(0, 60);
      }

      if (body.isImportant !== undefined) {
        updates.isImportant = Boolean(body.isImportant);
      }

      if (body.tags !== undefined) {
        updates.tags = normalizeTags(body.tags);
      }

      const updated = await updateTask(req.user!.uid, id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id ?? '');
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }

      const deleted = await deleteTask(req.user!.uid, id);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getCategoriesByUser(req.user!.uid);
      res.json(list);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load categories';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 60) : '';
      const color =
        typeof req.body?.color === 'string' && HEX_COLOR_REGEX.test(req.body.color)
          ? req.body.color
          : '#2563EB';

      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const created = await createCategory(req.user!.uid, name, color);
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id ?? '');
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      const deleted = await deleteCategory(req.user!.uid, id);
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TaskFlow server:', err);
  process.exit(1);
});
