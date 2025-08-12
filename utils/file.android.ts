import { IAnime } from '@/api/anime'
import * as RNFS from '@dr.pogodin/react-native-fs'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'

export const DIR = RNFS.DownloadDirectoryPath // 使用应用内私有目录

/**
 * 导出数据为json文件
 * @param data
 * @param filename
 * @returns
 */
export async function exportJsonFile(data: object, filename: string) {
    if (!filename.endsWith('.json')) {
        filename += '.json'
    }

    const path = `${DIR}/${filename}`

    const content = JSON.stringify(data, null, 2)
    await RNFS.writeFile(path, content, {
        encoding: FileSystem.EncodingType.UTF8,
    })

    return true
}

/**
 * 导入json文件数据
 * @returns
 */
export async function importJsonFile(): Promise<{ animeList: IAnime[] }> {
    const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
    })

    if (result.canceled || !result.assets || result.assets.length === 0) {
        throw Error('用户取消选择')
    }

    const file = result.assets[0]
    const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
    })

    const data = JSON.parse(content)
    return data
}

/**
 * 扫描应用私有目录中的json文件
 * @returns
 */
export async function scanJsonFile(): Promise<{ name: string; size: number }[]> {
    console.log('开始扫描')
    const files = await RNFS.readDir(DIR)
    const jsonFiles: { name: string; size: number }[] = []

    for (const item of files) {
        if (item.name.endsWith('.json')) {
            jsonFiles.push({
                name: item.name,
                size: item.size,
            })
        }
    }

    return jsonFiles
}

/**
 * 删除json文件
 * @param fileName
 * @returns
 */
export async function deleteJsonFile(fileName: string): Promise<boolean> {
    if (!fileName.endsWith('.json')) {
        fileName += '.json'
    }

    const path = `${DIR}/${fileName}`
    await RNFS.unlink(path)

    return true
}
