import { getAnimeListByName } from '@/api/anime'
import Icon from '@/components/ui/Icon'
import { router, useNavigation } from 'expo-router'
import React, { useLayoutEffect, useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
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
            <View className="flex-row items-center gap-2">
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
                return (
                    <View key={item.id}>
                        <Text>{item.name}</Text>
                    </View>
                )
            })}
        </SafeAreaView>
    )
}
