import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

export function loadEnv() {
  const envPath = resolve(root, '.env')
  let sessionCookie = ''
  try {
    const content = readFileSync(envPath, 'utf-8')
    const match = content.match(/^CSES_SESSION_COOKIE=(.+)$/m)
    if (match) sessionCookie = match[1].trim()
  } catch {
    // .env not found
  }
  if (!sessionCookie) {
    console.error('CSES_SESSION_COOKIE not found in .env')
    process.exit(1)
  }
  return { sessionCookie, root }
}
