import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users, type UserRecord } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null
): Promise<UserRecord> {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName !== undefined ? { displayName: displayName ?? null } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile. Please try again.', { cause: error });
  }
}

export async function updateUserPreferences(
  uid: string,
  updates: { themePreference?: 'light' | 'dark'; displayName?: string | null }
): Promise<UserRecord | null> {
  try {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.uid, uid))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in updateUserPreferences:', error);
    throw new Error('Failed to update user preferences. Please try again.', { cause: error });
  }
}
