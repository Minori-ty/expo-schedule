import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { addCalendarEvent, deleteCalendarEvent } from '@/utils/calendar'
import { getcurrentEpisode } from '@/utils/time'
import { eq } from 'drizzle-orm'
import { DeepExpand } from 'types-tools'
import { addAnime, getAnimeById, TAddAnimeData } from './anime'

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
