import { handleDeleteAnime } from '@/api'
import { parseAnimeData } from '@/api/anime'
import Loading from '@/components/lottie/Loading'
import { Modal } from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import Icon from '@/components/ui/Icon'
import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { blurhash, themeColorPurple } from '@/styles'
import { TAnimeList } from '@/types'
import { cn } from '@/utils/cn'
import { queryClient } from '@/utils/react-query'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { debounce } from 'lodash-es'
import React, { createContext, memo, useCallback, useContext, useMemo, useState } from 'react'
import {
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const GAP = 10

interface IMyAnimeContext {
    isLoading: boolean
    handleDeleteAnimeMutation: (id: number) => void
}
const myAnimeContext = createContext<IMyAnimeContext | null>(null)

const useMyAnimeContext = () => {
    const ctx = useContext(myAnimeContext)
    if (!ctx) throw new Error('缺少provider')
    return ctx
}

export default function MyAnime() {
    const router = useRouter()

    const { data, updatedAt } = useLiveQuery(db.select().from(animeTable))
    const list = useMemo(() => {
        return data.map(item => parseAnimeData(item))
    }, [data])

    const isLoading = useMemo(() => {
        return !updatedAt
    }, [updatedAt])

    const { mutate: handleDeleteAnimeMutation } = useMutation({
        mutationFn: handleDeleteAnime,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['search'],
            })
        },
    })

    const handlePress = useCallback(() => {
        const debouncePush = debounce(
            () => {
                router.push('/addAnime')
            },
            300,
            {
                leading: true,
                trailing: false,
            }
        )

        debouncePush()

        return () => debouncePush.cancel()
    }, [router])

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white pt-4">
            <myAnimeContext.Provider value={{ isLoading, handleDeleteAnimeMutation }}>
                <PageHeader
                    // leading={<Icon name="Heart" size={24} />}
                    title="我的追番"
                    actions={[
                        <TouchableOpacity onPress={() => router.push('/search')} key={'search'}>
                            <Icon name="Search" size={24} />
                        </TouchableOpacity>,
                        <TouchableOpacity onPress={handlePress} key={'setting'}>
                            <Icon name="Settings2" size={24} />
                        </TouchableOpacity>,
                        <TouchableOpacity onPress={handlePress} key={'plus'}>
                            <Icon name="Plus" size={34} />
                        </TouchableOpacity>,
                    ]}
                    className="px-6"
                />
                {list.length > 0 ? <AnimeContainer list={list} /> : <Empty />}
            </myAnimeContext.Provider>
        </SafeAreaView>
    )
}

interface IAnimeContainerProps {
    list: TAnimeList
}
const AnimeContainer = memo(function AnimeContainer({ list }: IAnimeContainerProps) {
    const { isLoading } = useMyAnimeContext()
    const [timestamp, setTimestamp] = useState(dayjs().unix())

    function onRefetch() {
        console.log(dayjs().unix())
        setTimestamp(dayjs().unix())
    }
    return (
        <FlatList
            data={list}
            keyExtractor={item => item.id.toString()}
            numColumns={3}
            columnWrapperStyle={{ gap: GAP }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: GAP, paddingHorizontal: GAP }}
            renderItem={({ item }) => <AnimeContainerItem data={item} key={timestamp} />}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={onRefetch}
                    className="text-theme"
                    colors={[themeColorPurple]}
                />
            }
        />
    )
})

interface IAnimeContainerItemProps {
    data: TAnimeList[number]
}
const AnimeContainerItem = memo(function AnimeContainerItem({ data }: IAnimeContainerItemProps) {
    const router = useRouter()
    const { handleDeleteAnimeMutation } = useMyAnimeContext()

    const handleToAnimeDetail = useCallback(() => {
        const debounceHandle = debounce(
            () => {
                router.push(`/animeDetail/${data.id}`)
            },
            300,
            {
                leading: true,
                trailing: false,
            }
        )
        debounceHandle()
        return () => debounceHandle.cancel()
    }, [data.id, router])
    return (
        <Pressable
            onPress={handleToAnimeDetail}
            onLongPress={() => {
                Modal.show({
                    body: <Text className="text-sm">你确定要删除 &quot;{data.name}&quot; 吗?</Text>,
                    onConfirm: () => handleDeleteAnimeMutation(data.id),
                })
            }}
            delayLongPress={300}
            style={{ width: (Dimensions.get('window').width - GAP * 4) / 3 }}
        >
            <View
                className={cn(
                    'overflow-hidden rounded-lg',
                    `h-${((Dimensions.get('window').width - GAP * 4) / 3) * 1.5}px`
                )}
            >
                <Image
                    source={data.cover}
                    placeholder={{ blurhash }}
                    contentFit="cover"
                    transition={500}
                    cachePolicy={'memory-disk'}
                    style={styles.cover}
                />
                <UpdateLabel status={data.status} />
            </View>
            <Text numberOfLines={1} className="font-semibold">
                {data.name}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">更新 第{data.currentEpisode}集</Text>
        </Pressable>
    )
})

function Empty() {
    const { isLoading } = useMyAnimeContext()
    const [timestamp, setTimestamp] = useState(dayjs().unix())
    function refetch() {
        setTimestamp(dayjs().unix())
    }
    return (
        <ScrollView
            contentContainerStyle={styles.center}
            key={timestamp}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={refetch}
                    className="text-theme"
                    colors={[themeColorPurple]}
                />
            }
        >
            {isLoading ? <Loading /> : <Text>暂无动漫数据，请先到右上角添加动漫</Text>}
        </ScrollView>
    )
}

interface IUpdateLabelProps {
    status: typeof EStatus.valueType
}
function UpdateLabel({ status }: IUpdateLabelProps) {
    return (
        <View
            className={cn('absolute bottom-0 left-0 h-8 items-center justify-center rounded-tr-lg px-2')}
            style={{ backgroundColor: EStatus.raw(status).color }}
        >
            <Text className="truncate text-white">{EStatus.raw(status).label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    cover: {
        width: (Dimensions.get('window').width - GAP * 4) / 3,
        height: ((Dimensions.get('window').width - GAP * 4) / 3) * 1.5,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
})
