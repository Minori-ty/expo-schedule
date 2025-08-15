import { getAnimeListByName } from '@/api/anime'
import Icon from '@/components/ui/Icon'
import { EStatus } from '@/enums'
import { blurhash } from '@/styles'
import { cn } from '@/utils/cn'
import { getcurrentEpisode, getLastEpisodeTimestamp, getStatus } from '@/utils/time'
import { Enum } from 'enum-plus'
import { Image } from 'expo-image'
import { router, useNavigation } from 'expo-router'
import React, { useLayoutEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
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
    }

    const EStatusColor = Enum({
        completed: {
            value: EStatus.completed,
            color: 'text-completed',
        },
        serializing: {
            value: EStatus.serializing,
            color: 'text-serializing',
        },
        toBeUpdated: {
            value: EStatus.toBeUpdated,
            color: 'text-toBeUpdated',
        },
    } as const)

    return (
        <SafeAreaView className="flex-1 bg-white px-6">
            <ScrollView className="flex-1">
                <View className="my-5 flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Icon name="ArrowLeft" />
                    </TouchableOpacity>
                    <View className="flex-1 flex-row items-center rounded-3xl border border-[#ccc] pl-2">
                        <Icon name="Search" size={20} />
                        <TextInput
                            className="h-10 flex-1 p-0 pl-2 pt-1 text-end text-base leading-7"
                            onChangeText={setKeyword}
                            onEndEditing={search}
                        />
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

                    return (
                        <TouchableOpacity
                            key={item.id}
                            className="mb-2 flex-row"
                            onPress={() => router.push(`/animeDetail/${item.id}`)}
                            activeOpacity={0.5}
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
                                <Text className={cn('text-sm')}>
                                    状态：
                                    <Text className={cn(EStatusColor.raw(status).color)}>
                                        {EStatus.raw(status).label}
                                    </Text>
                                </Text>
                                <Text className="text-sm">
                                    更新进度:
                                    <Text>
                                        {` ${getcurrentEpisode({ firstEpisodeTimestamp: item.firstEpisodeTimestamp, totalEpisode: item.totalEpisode })}/${item.totalEpisode}`}
                                    </Text>
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>
        </SafeAreaView>
    )
}

const width = 80
const styles = StyleSheet.create({
    cover: {
        width: 80,
        height: width * 1.5,
        borderRadius: 6,
        marginRight: 10,
    },
})
