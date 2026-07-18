import { getStore as netlifyGetStore } from '@netlify/blobs'
import fs from 'node:fs'
import path from 'node:path'

function createLocalStore(storeName: string) {
  const sanitizeKey = (key: string) => {
    // 簡單的安全化，防止路徑穿越（directory traversal）
    return encodeURIComponent(key)
  }

  // 偵測是否在 Netlify (AWS Lambda) 雲端執行期環境
  const isNetlifyRuntime = Boolean(
    process.env.NETLIFY === 'true' ||
    process.env.NETLIFY === '1' ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.cwd().startsWith('/var/task')
  )

  // 如果在 Netlify 環境，寫入到 /tmp，否則寫入專案的 .data/blobs
  const baseDir = isNetlifyRuntime
    ? path.join('/tmp', 'netlify-blobs', storeName)
    : path.join(process.cwd(), '.data', 'blobs', storeName)

  const ensureDir = () => {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
    }
  }

  return {
    async get(key: string, options?: { type?: 'text' | 'json' }) {
      ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      if (!fs.existsSync(filePath)) {
        return null
      }
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        if (options?.type === 'json') {
          return JSON.parse(content)
        }
        return content
      } catch {
        return null
      }
    },

    async set(key: string, value: any) {
      ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      fs.writeFileSync(filePath, String(value), 'utf-8')
    },

    async setJSON(key: string, value: any) {
      ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
    },

    async delete(key: string) {
      ensureDir()
      const filePath = path.join(baseDir, sanitizeKey(key))
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch {
          // 忽略刪除失敗
        }
      }
    },

    async list() {
      ensureDir()
      try {
        const files = fs.readdirSync(baseDir)
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
    // 當在本地開發或沒有環境變數時，直接回傳本地商店
    return local
  }

  // 封裝以確保任何執行期錯誤（如 deploy preview 無寫入權限 403）都能降級回本地商店
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
