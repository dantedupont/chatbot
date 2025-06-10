import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `my-chatbot_${name}`);

export const chats = createTable("chat", (d) => ({
  id: d.varchar({ length: 256 }).primaryKey(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));


export const messages = createTable("messages", (d) => ({
  id: d.varchar({ length: 256 }).primaryKey(),
  chat_id: d.varchar({ length: 256 }).references(() => chats.id),
  role: d.varchar({ length: 50 }), 
  content: d.text(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull()
}));