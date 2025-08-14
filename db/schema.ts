import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

/** 动漫列表数据表 */
export const animeTable = sqliteTable('anime', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    name: text('name').notNull(),
    totalEpisode: integer('total_episode').notNull(),
    cover: text('cover').notNull(),
    /** unix时间戳 */
    createdAt: integer('created_at')
        .notNull()
        .default(sql`(unixepoch())`),
    /** unix时间戳 */
    updatedAt: integer('updated_at')
        .notNull()
        .default(sql`(unixepoch())`),
    /** unix时间戳 */
    firstEpisodeTimestamp: integer('first_episode_timestamp').notNull(),
    /** 日历的id */
    eventId: text('event_id'),
})

// 生成 Zod 验证模式
export const insertAnimeSchema = createInsertSchema(animeTable, {
    createdAt: schema => schema.int().gte(0),
    updatedAt: schema => schema.int().gte(0),
    firstEpisodeTimestamp: schema => schema.int().gte(0),
})

export const selectAnimeSchema = createSelectSchema(animeTable)
