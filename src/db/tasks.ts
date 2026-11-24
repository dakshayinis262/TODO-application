import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from './index.ts';
import { tasks, type TaskRecord } from './schema.ts';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: TaskPriority;
  category?: string;
  status?: TaskStatus;
  isImportant?: boolean;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: TaskPriority;
  category?: string;
  status?: TaskStatus;
  isImportant?: boolean;
  tags?: string[];
}

export async function getTasksByUser(userId: string): Promise<TaskRecord[]> {
  try {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  } catch (error) {
    console.error('Database query failed in getTasksByUser:', error);
    throw new Error('Failed to load tasks. Please try again.', { cause: error });
  }
}

export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<TaskRecord> {
  try {
    const [created] = await db
      .insert(tasks)
      .values({
        userId,
        title: input.title,
        description: input.description ?? '',
        dueDate: input.dueDate ?? null,
        dueTime: input.dueTime ?? null,
        priority: input.priority ?? 'Medium',
        category: input.category ?? 'Personal',
        status: input.status ?? 'Pending',
        isImportant: input.isImportant ?? false,
        tags: input.tags ?? [],
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Database query failed in createTask:', error);
    throw new Error('Failed to create task. Please try again.', { cause: error });
  }
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<TaskRecord | null> {
  try {
    const updatePayload: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.dueDate !== undefined) updatePayload.dueDate = input.dueDate;
    if (input.dueTime !== undefined) updatePayload.dueTime = input.dueTime;
    if (input.priority !== undefined) updatePayload.priority = input.priority;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.isImportant !== undefined) updatePayload.isImportant = input.isImportant;
    if (input.tags !== undefined) updatePayload.tags = input.tags;

    const [updated] = await db
      .update(tasks)
      .set(updatePayload)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('Database query failed in updateTask:', error);
    throw new Error('Failed to update task. Please try again.', { cause: error });
  }
}

export async function deleteTask(userId: string, taskId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning({ id: tasks.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteTask:', error);
    throw new Error('Failed to delete task. Please try again.', { cause: error });
  }
}

export async function bulkDeleteTasks(
  userId: string,
  taskIds: string[]
): Promise<number> {
  if (taskIds.length === 0) return 0;
  try {
    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.userId, userId), inArray(tasks.id, taskIds)))
      .returning({ id: tasks.id });

    return deleted.length;
  } catch (error) {
    console.error('Database query failed in bulkDeleteTasks:', error);
    throw new Error('Failed to delete selected tasks. Please try again.', { cause: error });
  }
}

export async function clearCompletedTasks(userId: string): Promise<number> {
  try {
    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, 'Completed')))
      .returning({ id: tasks.id });

    return deleted.length;
  } catch (error) {
    console.error('Database query failed in clearCompletedTasks:', error);
    throw new Error('Failed to clear completed tasks. Please try again.', { cause: error });
  }
}
