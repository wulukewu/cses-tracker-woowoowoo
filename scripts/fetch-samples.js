import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadEnv } from './env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SAMPLES_DIR = resolve(__dirname, '..', 'data', 'samples')

async function fetchSamples(taskId) {
  const outPath = resolve(SAMPLES_DIR, `${taskId}.txt`)

  if (existsSync(outPath)) {
    const content = readFileSync(outPath, 'utf-8').trim()
    if (content) return content
  }

  const res = await fetch(`https://cses.fi/problemset/task/${taskId}/`, {
    headers: { 'user-agent': 'cses-automation' },
  })
  const html = await res.text()

  const samples = []
  const codeRegex = /<pre>([\s\S]*?)<\/pre>/g
  let match
  while ((match = codeRegex.exec(html)) !== null) {
    samples.push(match[1].trim())
  }

  // CSES typically has sample input then sample output (even number)
  // Pair them: odd indices = input, even = output (0-indexed from first <pre>)
  let result = ''
  for (let i = 0; i + 1 < samples.length; i += 2) {
    if (result) result += '\n---\n'
    result += samples[i] + '\n---\n' + samples[i + 1]
  }

  mkdirSync(SAMPLES_DIR, { recursive: true })
  writeFileSync(outPath, result || '')
  return result
}

const taskId = Number(process.argv[2])
if (!taskId) {
  console.error('Usage: node fetch-samples.js <taskId>')
  process.exit(1)
}

const samples = await fetchSamples(taskId)
console.log(samples)
