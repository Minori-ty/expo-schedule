import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import Icon from '@/components/ui/Icon'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { themeColorPurple } from '@/styles'
import { cn } from '@/utils/cn'

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: themeColorPurple,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        // Use a transparent background on iOS to show the blur effect
                        position: 'absolute',
                    },
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '更新表',
                    tabBarIcon: IndexIcon,
                }}
            />
            <Tabs.Screen
                name="myAnime"
                options={{
                    title: '我的追番',
                    tabBarIcon: MyAnimeIcon,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: '数据管理',
                    tabBarIcon: SettingsIcon,
                }}
            />
        </Tabs>
    )
}

function IndexIcon({ focused }: { color: string; focused: boolean }) {
    return <Icon name="CalendarClock" className={cn('text-gray-500', focused && 'text-theme')} />
}
function MyAnimeIcon({ focused }: { color: string; focused: boolean }) {
    return <Icon name="Heart" className={cn('text-gray-500', focused && 'text-theme')} />
}
function SettingsIcon({ focused }: { color: string; focused: boolean }) {
    return <Icon name="Settings" className={cn('text-gray-500', focused && 'text-theme')} />
}
