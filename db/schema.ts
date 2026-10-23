import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const catalog=sqliteTable('event_catalog',{id:text('id').primaryKey(),payload:text('payload').notNull(),checkedAt:text('checked_at').notNull()});
export const catalogState=sqliteTable('catalog_state',{id:text('id').primaryKey(),payload:text('payload').notNull()});
