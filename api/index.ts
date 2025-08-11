import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { addCalendarEvent, deleteCalendarEvent } from '@/utils/calendar'
import { getcurrentEpisode, getLastEpisodeTimestamp, getStatus } from '@/utils/time'
import { eq } from 'drizzle-orm'
import type { DeepExpand } from 'types-tools'
import { addAnime, getAnimeById, updateAnimeById, type IUpdateAnimeByAnimeId, type TAddAnimeData } from './anime'

type THandleAddAnime = DeepExpand<Omit<TAddAnimeData, 'eventId'>>
/**
 * 添加动漫归一化处理
 */
export async function handleAddAnime(animeData: THandleAddAnime) {
    return await db.transaction(async tx => {
        const { name, totalEpisode, firstEpisodeTimestamp, cover } = animeData

        const currentEpisode = getcurrentEpisode({ firstEpisodeTimestamp, totalEpisode })
        const eventId = await addCalendarEvent({
            name,
            firstEpisodeTimestamp,
            currentEpisode,
            totalEpisode,
        })
        await addAnime(tx, {
            cover,
            name,
            firstEpisodeTimestamp,
            totalEpisode,
            eventId,
        })
    })
}

/**
 * 删除动漫归一化处理
 */
export async function handleDeleteAnime(animeId: number) {
    await db.transaction(async tx => {
        const result = await getAnimeById(tx, animeId)
        if (!result) return
        if (result.eventId) {
            await deleteCalendarEvent(result.eventId)
        }
        await tx.delete(animeTable).where(eq(animeTable.id, animeId))
        console.log('删除动漫成功')
    })
}

export async function handleUpdateAnimeById(data: DeepExpand<Omit<IUpdateAnimeByAnimeId, 'eventId'>>) {
    return await db.transaction(async tx => {
        const result = await getAnimeById(tx, data.animeId)
        if (!result) {
            console.log('animeId对应的动漫不存在，就不更新数据了')
            return
        }
        // 新的数据
        const { name, cover, firstEpisodeTimestamp, totalEpisode } = data
        const lastEpisodeTimestamp = getLastEpisodeTimestamp({ firstEpisodeTimestamp, totalEpisode })
        const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)
        const { eventId } = result
        const currentEpisode = getcurrentEpisode({ firstEpisodeTimestamp, totalEpisode })

        // 处理删除日历事件的逻辑
        if (eventId) {
            await deleteCalendarEvent(eventId)
        }

        // 根据状态处理不同逻辑
        if (status === EStatus.completed) {
            // 完成状态，将eventId设为null
            await updateAnimeById(tx, {
                animeId: data.animeId,
                eventId: null,
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp,
            })
        } else {
            // toBeUpdated状态和其他状态处理逻辑相同
            const newEventId = await addCalendarEvent({
                name,
                firstEpisodeTimestamp,
                currentEpisode,
                totalEpisode,
            })
            await updateAnimeById(tx, {
                animeId: data.animeId,
                eventId: newEventId,
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp,
            })
        }

        console.log('更新动漫数据成功')
    })
}
