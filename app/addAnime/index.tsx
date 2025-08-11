import { handleAddAnime } from '@/api'
import { getAnimeByName } from '@/api/anime'
import BaseAnimeForm from '@/components/BaseForm'
import { formDefaultValues, type TFormSchema } from '@/components/schema'
import { EStatus } from '@/enums'
import { queryClient } from '@/utils/react-query'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { router, useNavigation } from 'expo-router'
import React, { useLayoutEffect } from 'react'
import { type SubmitHandler } from 'react-hook-form'
import Toast from 'react-native-toast-message'

export default function Index() {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '添加动漫',
            headerTitleAlign: 'center',
        })
    }, [navigation])

    const onSubmit: SubmitHandler<TFormSchema> = async data => {
        const { name, cover, totalEpisode } = data
        const result = await handleValidateAnimeNameIsExist(name)
        if (result) return
        if (data.status === EStatus.serializing) {
            const { currentEpisode, updateTimeHHmm, updateWeekday } = data
            if (updateWeekday === '') return
            handleAddAnimeMution({
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: getFirstEpisodeTimestamp({ currentEpisode, updateTimeHHmm, updateWeekday }),
            })
        } else if (data.status === EStatus.completed) {
            const { lastEpisodeYYYYMMDDHHmm } = data
            handleAddAnimeMution({
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm')
                    .subtract(totalEpisode - 1, 'week')
                    .second(0)
                    .unix(),
            })
        } else if (data.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            handleAddAnimeMution({
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').second(0).unix(),
            })
        }
    }

    const { mutate: handleAddAnimeMution } = useMutation({
        mutationFn: handleAddAnime,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['my-anime'],
            })
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })

            router.back()
        },
        onError: err => {
            alert(err)
        },
    })

    /**
     * 校验动漫名是否存在
     * @param name
     */
    async function handleValidateAnimeNameIsExist(name: string) {
        const result = await getAnimeByName(name)
        if (result) {
            Toast.show({
                type: 'error',
                text1: '该动漫已存在，请勿重复添加。如需修改，请编辑该动漫。',
            })
            return true
        }
        return false
    }

    return <BaseAnimeForm formData={formDefaultValues} onSubmit={onSubmit} />
}
