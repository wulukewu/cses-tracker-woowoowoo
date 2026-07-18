import { getStore as netlifyGetStore } from '@netlify/blobs'
import fs from 'node:fs'
import path from 'node:path'

function createLocalStore(storeName: string) {
  const sanitizeKey = (key: string) => {
    // 簡單的安全化，防止路徑穿越（directory traversal）
    return encodeURIComponent(key)
  }

  // 本地 storage 目錄：專案根目錄下的 .data/blobs/[storeName]
  const baseDir = path.join(process.cwd(), '.data', 'blobs', storeName)

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
  const isNetlify = process.env.NETLIFY === 'true' || process.env.NETLIFY === '1'
  const hasLocalCreds = Boolean(
    process.env.NETLIFY_BLOBS_API_URL ||
    (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN)
  )

  // 如果不在 Netlify 雲端環境，且沒有相關 CLI 憑證變數，就直接使用本地 Fallback Store
  if (!isNetlify && !hasLocalCreds) {
    return createLocalStore(storeName)
  }

  try {
    return netlifyGetStore(storeName)
  } catch (err: any) {
    if (err?.name === 'MissingBlobsEnvironmentError' || err?.message?.includes('Netlify Blobs')) {
      return createLocalStore(storeName)
    }
    throw err
  }
}
