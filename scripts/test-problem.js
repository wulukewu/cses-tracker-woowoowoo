import { execSync } from 'child_process'
import { readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadEnv } from './env.js'
import { loadProblems, slugify, categoryDir, woowoowooPath, CP_BASE } from './problems.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SAMPLES_DIR = resolve(__dirname, '..', 'data', 'samples')
const TMP_BIN = resolve(__dirname, '..', 'tmp', 'a.out')

function findProblem(taskId) {
  const cats = loadProblems()
  for (let i = 0; i < cats.length; i++) {
    for (const p of cats[i].problems) {
      if (p.id === taskId) return { catIndex: i, catName: cats[i].name, problem: p }
    }
  }
  return null
}

async function fetchSamples(taskId) {
  const outPath = resolve(SAMPLES_DIR, `${taskId}.txt`)
  if (existsSync(outPath)) {
    const c = readFileSync(outPath, 'utf-8').trim()
    if (c) return c
  }
  const res = await fetch(`https://cses.fi/problemset/task/${taskId}/`, {
    headers: { 'user-agent': 'cses-automation' },
  })
  const html = await res.text()
  const samples = []
  const codeRegex = /<pre>([\s\S]*?)<\/pre>/g
  let m
  while ((m = codeRegex.exec(html)) !== null) {
    samples.push(m[1].trim())
  }
  let result = ''
  for (let i = 0; i + 1 < samples.length; i += 2) {
    if (result) result += '\n---\n'
    result += samples[i] + '\n---\n' + samples[i + 1]
  }
  mkdirSync(SAMPLES_DIR, { recursive: true })
  writeFileSync(outPath, result || '')
  return result
}

function normalizeOutput(s) {
  return s.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
         .split('\n').map(l => l.trimEnd()).join('\n').trim()
}

function parseSamples(raw) {
  const blocks = raw.split('\n---\n')
  const pairs = []
  for (let i = 0; i + 1 < blocks.length; i += 2) {
    pairs.push({ input: blocks[i].trim(), expected: normalizeOutput(blocks[i + 1]) })
  }
  return pairs
}

async function testProblem(taskId) {
  const info = findProblem(taskId)
  if (!info) {
    console.log(`UNKNOWN: no problem with id ${taskId}`)
    return false
  }
  const { catIndex, catName, problem } = info

  const { filePath } = woowoowooPath(catIndex, catName, problem.name)
  if (!existsSync(filePath)) {
    console.log(`MISS: ${problem.name} (${taskId}) — no woowoowoo file`)
    return false
  }

  // Compile
  try {
    execSync(`g++ -std=c++17 -O2 -o "${TMP_BIN}" "${filePath}"`, {
      stdio: 'pipe',
      timeout: 15000,
    })
  } catch (e) {
    const err = e.stderr?.toString() || e.message
    console.log(`COMPILE ERROR: ${problem.name} (${taskId})`)
    console.log(err.slice(0, 500))
    return false
  }

  // Fetch samples
  const raw = await fetchSamples(taskId)
  if (!raw) {
    console.log(`NO SAMPLES: ${problem.name} (${taskId}) — skipping test`)
    return true // no samples to test against, pass
  }
  const pairs = parseSamples(raw)
  if (pairs.length === 0) {
    console.log(`NO SAMPLES: ${problem.name} (${taskId}) — skipping test`)
    return true
  }

  for (let i = 0; i < pairs.length; i++) {
    const { input, expected } = pairs[i]
    try {
      const out = normalizeOutput(execSync(`"${TMP_BIN}"`, {
        input,
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).toString())
      if (out !== expected) {
        console.log(`FAIL sample ${i + 1}: ${problem.name} (${taskId})`)
        console.log(`expected:\n${expected.slice(0, 200)}`)
        console.log(`got:\n${out.slice(0, 200)}`)
        return false
      }
    } catch (e) {
      const err = e.stderr?.toString() || e.message
      console.log(`RUNTIME ERROR sample ${i + 1}: ${problem.name} (${taskId})`)
      console.log(err.slice(0, 300))
      return false
    }
  }

  console.log(`PASS: ${problem.name} (${taskId})`)
  return true
}

const taskId = Number(process.argv[2])
if (!taskId) {
  console.error('Usage: node test-problem.js <taskId>')
  process.exit(1)
}

const passed = await testProblem(taskId)
process.exit(passed ? 0 : 1)
