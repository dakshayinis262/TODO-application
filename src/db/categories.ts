import { and, asc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { categories, type CategoryRecord } from './schema.ts';

export async function getCategoriesByUser(userId: string): Promise<CategoryRecord[]> {
  try {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));
  } catch (error) {
    console.error('Database query failed in getCategoriesByUser:', error);
    throw new Error('Failed to load categories. Please try again.', { cause: error });
  }
}

export async function createCategory(
  userId: string,
  name: string,
  color: string
): Promise<CategoryRecord> {
  try {
    const [created] = await db
      .insert(categories)
      .values({
        userId,
        name,
        color,
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Database query failed in createCategory:', error);
    throw new Error('Failed to create category. Please try again.', { cause: error });
  }
}

export async function deleteCategory(userId: string, categoryId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning({ id: categories.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteCategory:', error);
    throw new Error('Failed to delete category. Please try again.', { cause: error });
  }
}
