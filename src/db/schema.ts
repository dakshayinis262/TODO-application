import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  themePreference: text('theme_preference').default('light').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').default('').notNull(),
    dueDate: date('due_date', { mode: 'string' }),
    dueTime: time('due_time'),
    priority: text('priority').default('Medium').notNull(),
    category: text('category').default('Personal').notNull(),
    status: text('status').default('Pending').notNull(),
    isImportant: boolean('is_important').default(false).notNull(),
    tags: text('tags')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('tasks_user_id_idx').on(table.userId),
    index('tasks_due_date_idx').on(table.dueDate),
  ]
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').default('#2563EB').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('categories_user_id_idx').on(table.userId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  categories: many(categories),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  owner: one(users, {
    fields: [tasks.userId],
    references: [users.uid],
  }),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  owner: one(users, {
    fields: [categories.userId],
    references: [users.uid],
  }),
}));

export type UserRecord = typeof users.$inferSelect;
export type TaskRecord = typeof tasks.$inferSelect;
export type NewTaskRecord = typeof tasks.$inferInsert;
export type CategoryRecord = typeof categories.$inferSelect;
