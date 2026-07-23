import { getStore as netlifyGetStore } from '@netlify/blobs'
import fsp from 'node:fs/promises'
import path from 'node:path'

function createLocalStore(storeName: string) {
  const sanitizeKey = (key: string) => {
    return encodeURIComponent(key)
  }

  const isNetlifyRuntime = Boolean(
    process.env.NETLIFY === 'true' ||
    process.env.NETLIFY === '1' ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.cwd().startsWith('/var/task')
  )

  const baseDir = isNetlifyRuntime
    ? path.join('/tmp', 'netlify-blobs', storeName)
    : path.join(process.cwd(), '.data', 'blobs', storeName)

  const ensureDir = async () => {
    await fsp.mkdir(baseDir, { recursive: true })
  }

  return {
    async get(key: string, options?: { type?: 'text' | 'json' }) {
      await ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      try {
        const content = await fsp.readFile(filePath, 'utf-8')
        if (options?.type === 'json') {
          return JSON.parse(content)
        }
        return content
      } catch {
        return null
      }
    },

    async set(key: string, value: any) {
      await ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      await fsp.writeFile(filePath, String(value), 'utf-8')
    },

    async setJSON(key: string, value: any) {
      await ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      await fsp.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8')
    },

    async delete(key: string) {
      await ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      try {
        await fsp.unlink(filePath)
      } catch {
      }
    },

    async list() {
      await ensureDir()
      try {
        const files = await fsp.readdir(baseDir)
        const blobs = files.map((file) => ({
          key: decodeURIComponent(file),
        }))
        return { blobs }
      } catch {
        return { blobs: [] }
      }
    }
  }
}

export function getStore(storeName: string): any {
  const local = createLocalStore(storeName)

  let netlifyStore: any = null
  try {
    netlifyStore = netlifyGetStore(storeName)
  } catch (err: any) {
    return local
  }

  let useFallback = false

  const safeOp = async (opName: string, ...args: any[]) => {
    if (!useFallback && netlifyStore) {
      try {
        return await netlifyStore[opName](...args)
      } catch (err: any) {
        console.error(`[netlify-blobs] Operation ${opName} failed on Netlify store ${storeName}, falling back to local:`, err)
        useFallback = true
      }
    }
    return await (local as any)[opName](...args)
  }

  return {
    async get(key: string, options?: any) {
      return safeOp('get', key, options)
    },
    async set(key: string, value: any) {
      return safeOp('set', key, value)
    },
    async setJSON(key: string, value: any) {
      return safeOp('setJSON', key, value)
    },
    async delete(key: string) {
      return safeOp('delete', key)
    },
    async list() {
      return safeOp('list')
    }
  }
}
