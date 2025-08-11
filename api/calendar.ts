import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { addCalendarEvent, deleteCalendarEvent } from '@/utils/calendar'
import { getcurrentEpisode } from '@/utils/time'
import { eq } from 'drizzle-orm'
import { getAnimeById } from './anime'

export async function addCalendarByAnimeId(animeId: number) {
    return await db.transaction(async tx => {
        const result = await getAnimeById(tx, animeId)
        if (!result) {
            console.log('该id对应的动漫不存在')
            return
        }
        const { name, firstEpisodeTimestamp, totalEpisode } = result
        const currentEpisode = getcurrentEpisode({ firstEpisodeTimestamp, totalEpisode })
        const eventId = await addCalendarEvent({
            name,
            firstEpisodeTimestamp,
            totalEpisode,
            currentEpisode,
        })
        if (!eventId) {
            console.log('创建日历事件失败了，就不修改动漫数据了')
            return
        }

        await tx.update(animeTable).set({ eventId }).where(eq(animeTable.id, animeId))
    })
}

export async function deleteCalendarByAnimeId(animeId: number) {
    return await db.transaction(async tx => {
        const result = await getAnimeById(tx, animeId)
        if (!result) {
            console.log('该id对应的动漫不存在')
            return
        }

        if (!result.eventId) {
            console.log('没有这个日历事件，有可能被用户主动删除了')
            return
        }

        await deleteCalendarEvent(result.eventId)
        await tx.update(animeTable).set({ eventId: null }).where(eq(animeTable.id, animeId))
    })
}

export async function deleteCalendarByAnimeIds(animeIds: number[]) {
    return await Promise.all(animeIds.map(deleteCalendarByAnimeId))
}
