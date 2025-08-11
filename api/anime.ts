import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus, EWeekday } from '@/enums'
import { TTx } from '@/types'
import { getcurrentEpisode, getLastEpisodeTimestamp, getStatus } from '@/utils/time'
import dayjs from 'dayjs'
import { and, eq, ne } from 'drizzle-orm'
import type { DeepExpand } from 'types-tools'

export interface IAddAnimeData {
    name: string
    totalEpisode: number
    cover: string
    firstEpisodeTimestamp: number
    eventId: string | null
}

export type TAddAnimeData = DeepExpand<{
    name: string
    totalEpisode: number
    cover: string
    firstEpisodeTimestamp: number
    eventId: string | null
}>
/**
 * 添加动漫
 * @param tx
 * @param data
 * @returns
 */
export async function addAnime(tx: TTx, data: DeepExpand<IAddAnimeData>) {
    const result = await tx.insert(animeTable).values(data).returning()
    if (result.length === 0) {
        console.log('添加动漫失败')
        return
    }
    return parseAnimeData(result[0])
}

export async function addAnimeList(tx: TTx, dataList: IAddAnimeData[]) {
    const result = await tx.insert(animeTable).values(dataList).returning()
    if (result.length === 0) {
        console.log('添加动漫失败')
        return []
    }
    return result.map(item => parseAnimeData(item))
}

/**
 * 根据id删除动漫
 * @param tx
 * @param animeId
 * @returns
 */
export async function deleteAnimeById(tx: TTx, id: number) {
    const result = await getAnimeById(tx, id)
    if (!result) {
        console.log('对应的动漫不存在，就不删除动漫了')
        return
    }
    await tx.delete(animeTable).where(eq(animeTable.id, id)).returning()
    console.log('删除动漫成功')
}

interface IUpdateAnimeByAnimeId extends IAddAnimeData {
    animeId: number
}

/**
 * 根据id更新动漫数据
 * @param tx
 * @param data
 * @returns
 */
export async function updateAnimeById(tx: TTx, data: DeepExpand<IUpdateAnimeByAnimeId>) {
    const result = await getAnimeById(tx, data.animeId)
    if (!result) {
        console.log('对应的animeId不存在，就不更新数据了')
        return
    }
    const { name, cover, firstEpisodeTimestamp, totalEpisode, eventId } = data

    await tx
        .update(animeTable)
        .set({
            name,
            cover,
            firstEpisodeTimestamp,
            totalEpisode,
            createdAt: dayjs().unix(),
            eventId,
        })
        .where(eq(animeTable.id, data.animeId))
    // console.log('更新动漫数据成功')
}

export interface IAnime {
    id: number
    name: string
    currentEpisode: number
    totalEpisode: number
    cover: string
    updateWeekday: typeof EWeekday.valueType
    firstEpisodeTimestamp: number
    lastEpisodeTimestamp: number
    status: typeof EStatus.valueType
    updateTimeHHmm: string
    eventId: string | null
}

/**
 * 获取所有动漫列表
 * @returns
 */
export async function getAnimeList() {
    const { refreshScheduleAndCalendar } = await import('@/backgroundTasks') // 延迟导入，避免循环引用
    await refreshScheduleAndCalendar()
    const animeList = await db.select().from(animeTable)
    return animeList.map(item => parseAnimeData(item))
}

/**
 * 根据id查找动漫
 * @param tx
 * @param id
 * @returns
 */
export async function getAnimeById(tx: TTx, id: number) {
    const result = await tx.select().from(animeTable).where(eq(animeTable.id, id))
    if (result.length === 0) {
        return
    }
    return result[0]
}

/**
 * 根据id查找动漫
 * @param id - 动漫id
 * @returns
 */
export async function handleGetAnimeById(id: number) {
    return db.transaction(async tx => {
        const data = await getAnimeById(tx, id)
        if (!data) return
        return parseAnimeData(data)
    })
}

/**
 * 给创建动漫用的，根据name查找动漫
 * @param tx
 * @param id
 * @returns
 */
export async function getAnimeByName(name: string) {
    const result = await db.select().from(animeTable).where(eq(animeTable.name, name))
    if (result.length === 0) {
        return
    }
    return result[0]
}

/**
 * 给编辑动漫用的，根据name查找除了自身id外的动漫
 * @param tx
 * @param id
 * @returns
 */
export async function getAnimeByNameExceptItself(name: string, id: number) {
    const result = await db
        .select()
        .from(animeTable)
        .where(and(eq(animeTable.name, name), ne(animeTable.id, id)))
    if (result.length === 0) {
        return
    }
    return result[0]
}

interface IParseAnimeData {
    id: number
    name: string
    totalEpisode: number
    cover: string
    createdAt: number
    firstEpisodeTimestamp: number
    eventId: string | null
}
/**
 * 将数据解析为动漫数据格式
 * @param data - 动漫数据
 * @returns
 */
export function parseAnimeData(data: IParseAnimeData): DeepExpand<IAnime> {
    const { id, name, totalEpisode, cover, firstEpisodeTimestamp, eventId } = data
    const updateWeekday = dayjs.unix(firstEpisodeTimestamp).isoWeekday() as typeof EWeekday.valueType
    const firstEpisodeYYYYMMDDHHmm = dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
    const lastEpisodeTimestamp = getLastEpisodeTimestamp({ firstEpisodeTimestamp, totalEpisode })

    const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)
    const currentEpisode = getcurrentEpisode({
        firstEpisodeTimestamp,
        totalEpisode,
    })

    return {
        id,
        name,
        currentEpisode,
        totalEpisode,
        cover,
        updateWeekday,
        firstEpisodeTimestamp,
        lastEpisodeTimestamp,
        status,
        updateTimeHHmm: firstEpisodeYYYYMMDDHHmm,
        eventId,
    }
}
