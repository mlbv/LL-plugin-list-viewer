import type { Config } from '../global'
const hostReg = /^https?:\/\/[^/]+/

export const originMirrors = ['https://mirror.ghproxy.com/', 'https://ghproxy.net/', 'https://github.moeyy.xyz/']
export const thisSlug = 'list-viewer'

export type SortType = 'default' | 'installed' | 'outdated'

export let config: Config

export async function initConfig() {
  const defaultConfig:Config = {
    inactivePlugins: [],
    debug: false,
    useMirror: true,
    useGithubIO: false,
    mirrors: {
      downloadUrl: ['https://cdn.jsdelivr.net/gh']
      // rawUrl: []
    },
    listSortType: 'default',
    githubToken: '',
    listLastForceUpdate: 0,
    proxy: {
      url: '',
      enabled: false
    },
    requestTimeout: 3e3
  }
  config = await (LiteLoader.api.config.get(thisSlug, defaultConfig) as PromiseLike<Config>)
  const save = debounce((obj: Config) => {
    const objCloned = JSON.parse(JSON.stringify(obj))
    config.debug && console.log('save obj', objCloned)
    LiteLoader.api.config.set(thisSlug, objCloned)
  }, 1e3)
  config = deepWatch(config, () => {
    save(config)
  })
}
export function getRandomItem(arr?: undefined): undefined
export function getRandomItem<T>(arr: Array<T>): T
export function getRandomItem<T>(arr: Array<T> | undefined): T | undefined
export function getRandomItem<T>(arr: Array<T> | undefined): T | undefined {
  return arr ? arr[Math.floor(Math.random() * arr.length)] : undefined
}

export function useMirror(url: string, mirror: string, removeHost = true) {
  if (/\/gh$/.test(mirror) && mirror.includes('jsdelivr')) {
    return mirror + new URL(url).pathname.replace(/\/raw\/(?:refs\/heads\/)?/, '@')
  } else {
    return mirror + (removeHost ? url.replace(hostReg, '') : url)
  }
}

export function useGeneralMirror(url: string, mirror: string) {
  return mirror + url
}

export function localFetch(path: string, plugin = 'list-viewer') {
  return fetch(`local:///${LiteLoader.plugins[plugin].path.plugin.replace(':\\', '://').replaceAll('\\', '/')}/${path.startsWith('/') ? path.slice(1) : path}`)
}

export function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeout = config.requestTimeout
): Promise<{
  data: ArrayBuffer
  str: string
  status?: number
  statusText?: string
  url?: string
}> {
  url = getRedirectedGitHubUrl(url) || url
  config.debug && console.log('fetchWithTimeout', url)
  if (config.proxy.enabled) {
    return ListViewer.request(url, {
      timeout,
      headers: options?.headers as Record<string, string> | undefined,
      body: options?.body,
      method: options?.method as 'GET' | 'POST' | undefined
    }).then(res => {
      if (res.success) {
        return res.data
      } else {
        throw new Error(res.message)
      }
    })
  }
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error('请求超时'))
    }, timeout)

    fetch(url, { ...options, signal: controller.signal })
      .then(async response => {
        clearTimeout(timeoutId)
        const ab = await response.arrayBuffer()
        resolve({
          data: ab,
          str: new TextDecoder().decode(ab),
          status: response.status,
          statusText: response.statusText,
          url: response.url
        })
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

export function debounce(func: (...args: any[]) => any, delay: number) {
  let timeoutId: any
  return function (...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export function deepWatch<T extends object>(obj: T, callback: () => void): T {
  const observer = new Proxy(obj, {
    set(target, key, value, receiver) {
      const oldValue = target[key]
      if (oldValue !== value) {
        // 如果值发生变化，调用回调函数
        callback()
        // 对象属性也是对象时，进行深度监听
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          deepWatch(value, callback)
        }
      }
      // 设置新的值
      return Reflect.set(target, key, value, receiver)
    }
  })

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        obj[i] = deepWatch(obj[i], callback)
      }
    }
  } else {
    for (const key in obj) {
      const value = obj[key]
      if (typeof value === 'object' && value !== null) {
        obj[key] = deepWatch(value, callback)
      }
    }
  }

  return observer
}

export function getRedirectedGitHubUrl(url: string) {
  const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/refs\/heads\/([^/]+)\/(.+)/
  const match = url.match(regex)

  if (match) {
    const user = match[1]
    const repo = match[2]
    const branch = match[3]
    const filePath = match[4]
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filePath}`
  }
  // throw new Error('Invalid GitHub URL')
  return
}

/**
 * 判断时间戳是否和今天是同一天
 */
export function isSameDay(timestamp: number) {
  const inputDate = new Date(timestamp)
  const currentDate = new Date()

  return inputDate.getFullYear() === currentDate.getFullYear() && inputDate.getMonth() === currentDate.getMonth() && inputDate.getDate() === currentDate.getDate()
}
