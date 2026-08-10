import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessionLogs = pgTable('session_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  productName: text('product_name').notNull(),
  inputMode: text('input_mode').notNull(),
  primaryPattern: text('primary_pattern').notNull(),
  technicals: jsonb('technicals'),
  analysis: jsonb('analysis').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessionLogs: many(sessionLogs),
}));

export const sessionLogsRelations = relations(sessionLogs, ({ one }) => ({
  user: one(users, {
    fields: [sessionLogs.userId],
    references: [users.id],
  }),
}));
