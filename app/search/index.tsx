import { getAnimeListByName } from '@/api/anime'
import Icon from '@/components/ui/Icon'
import { EStatus } from '@/enums'
import { blurhash } from '@/styles'
import { cn } from '@/utils/cn'
import { getcurrentEpisode, getLastEpisodeTimestamp, getStatus } from '@/utils/time'
import { ClassValue } from 'clsx'
import { Image } from 'expo-image'
import { router, useNavigation } from 'expo-router'
import React, { useLayoutEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Search() {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        })
    }, [navigation])

    const [keyword, setKeyword] = useState('')
    const [list, setList] = useState<any[]>([])

    async function search() {
        if (!keyword) return
        const result = await getAnimeListByName(keyword)
        setList(result)
        console.log(result)
    }

    return (
        <SafeAreaView className="px-6">
            <View className="my-5 flex-row items-center gap-2">
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="ArrowLeft" />
                </TouchableOpacity>
                <View className="h-10 flex-1 flex-row items-center rounded-3xl border border-gray-400 pl-2">
                    <Icon name="Search" size={20} />
                    <TextInput className="m-0 h-14 flex-1 p-0 pl-2" onChangeText={setKeyword} />
                </View>
                <TouchableOpacity onPress={search}>
                    <Text>搜索</Text>
                </TouchableOpacity>
            </View>

            {list.map(item => {
                const status = getStatus(
                    item.firstEpisodeTimestamp,
                    getLastEpisodeTimestamp({
                        firstEpisodeTimestamp: item.firstEpisodeTimestamp,
                        totalEpisode: item.totalEpisode,
                    })
                )

                const mapColor: Record<typeof EStatus.valueType, { bgColor: ClassValue; textColor: ClassValue }> = {
                    [EStatus.completed]: {
                        bgColor: 'bg-red-100',
                        textColor: 'text-red-900',
                    },
                    [EStatus.serializing]: {
                        bgColor: 'bg-green-100',
                        textColor: 'text-green-900',
                    },
                    [EStatus.toBeUpdated]: {
                        bgColor: 'bg-orange-100',
                        textColor: 'text-orange-900',
                    },
                }
                return (
                    <TouchableOpacity
                        key={item.id}
                        className="flex-row"
                        onPress={() => router.push(`/animeDetail/${item.id}`)}
                    >
                        <Image
                            source={item.cover}
                            placeholder={{ blurhash }}
                            contentFit="cover"
                            transition={500}
                            cachePolicy={'memory-disk'}
                            style={styles.cover}
                        />
                        <View>
                            <Text className="text-lg font-medium">{item.name}</Text>
                            <Text className="text-sm">
                                更新进度:
                                {` ${getcurrentEpisode({ firstEpisodeTimestamp: item.firstEpisodeTimestamp, totalEpisode: item.totalEpisode })}/${item.totalEpisode}`}
                            </Text>
                            <Text className={cn('text-sm', mapColor[status].textColor)}>
                                状态：
                                {EStatus.raw(status).label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )
            })}
        </SafeAreaView>
    )
}

const width = 80
const styles = StyleSheet.create({
    cover: {
        width: 80,
        height: width * 1.5,
        borderRadius: 12,
        marginRight: 10,
    },
})
