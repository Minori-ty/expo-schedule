import { getAnimeList } from '@/api/anime'
import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { deleteCalendarEvent } from '@/utils/calendar'
import { getLastEpisodeTimestamp, getStatus } from '@/utils/time'
import { eq } from 'drizzle-orm'
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'

/** 定时更新动漫更新表和动漫即将更新表 */
const BACKGROUND_TASK_NAME = 'REFRESH_SCHEDULE_AND_CALENDAR'

export function taskDefined() {
    const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)
    if (!isTaskDefined) {
        TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
            try {
                await deleteCompletedCalendars()
                return BackgroundTask.BackgroundTaskResult.Success
            } catch {
                return BackgroundTask.BackgroundTaskResult.Failed
            }
        })
    }
}

/**
 * 在App初始化时注册任务
 * @returns
 */
export async function registerBackgroundTask() {
    /** 是否注册了任务 */
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)
    if (isRegistered) return
    // 注册任务（iOS/Android 通用 API）
    BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 15, // 最少15分钟触发（单位：分钟）
    })
}

export async function deleteCompletedCalendars() {
    const list = await getAnimeList()
    list.forEach(async item => {
        const lastEpisodeTimestamp = getLastEpisodeTimestamp({
            firstEpisodeTimestamp: item.firstEpisodeTimestamp,
            totalEpisode: item.totalEpisode,
        })
        if (getStatus(item.firstEpisodeTimestamp, lastEpisodeTimestamp) === EStatus.completed && item.eventId) {
            await deleteCalendarEvent(item.eventId)
            await db.update(animeTable).set({ eventId: null }).where(eq(animeTable.id, item.id))
        }
    })
}
