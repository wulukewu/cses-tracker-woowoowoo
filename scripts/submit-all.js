import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import * as cheerio from 'cheerio'
import { loadEnv } from './env.js'
import {
  loadProblems, slugify, categoryDir, woowoowooPath, mainDirPath,
  CSES_USERNAME, CSES_USER_ID, CP_BASE,
} from './problems.js'

const { sessionCookie } = loadEnv()
const solvedIds = new Set()

async function fetchSolvedTasks() {
  console.log('[check] fetching solved tasks for woowoowoo...')
  const res = await fetch(`https://cses.fi/problemset/user/${CSES_USER_ID}/`, {
    headers: { cookie: sessionCookie, 'user-agent': 'cses-automation' },
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  $('a.task-score').each((_, el) => {
    const classes = ($(el).attr('class') || '').split(/\s+/)
    if (classes.includes('full')) {
      const href = $(el).attr('href') || ''
      const match = href.match(/\/problemset\/task\/(\d+)/)
      if (match) solvedIds.add(Number(match[1]))
    }
  })
  console.log(`[check] already solved: ${solvedIds.size} tasks`)
}

function ensureWoowoowooFile(catIndex, catName, problemName) {
  const { dir, filePath } = woowoowooPath(catIndex, catName, problemName)

  if (existsSync(filePath)) {
    return filePath
  }

  // Check main directory for existing solution
  const mainPath = mainDirPath(catIndex, catName, problemName)
  if (existsSync(mainPath)) {
    mkdirSync(dir, { recursive: true })
    const content = readFileSync(mainPath, 'utf-8')
    writeFileSync(filePath, content)
    console.log(`  [copy] from main dir`)
    return filePath
  }

  return null
}

async function submitOne(taskId, filePath, problemName, retries = 2) {
  console.log(`  [submit] id=${taskId}...`)

  const submitUrl = `https://cses.fi/problemset/submit/${taskId}/`
  const res = await fetch(submitUrl, {
    headers: { cookie: sessionCookie, 'user-agent': 'cses-automation' },
  })
  const html = await res.text()

  const csrfMatch = html.match(/name="csrf_token" value="([^"]+)"/)
  if (!csrfMatch) {
    if (retries > 0) {
      console.log(`  RETRY (no CSRF, ${retries} left)`)
      await new Promise(r => setTimeout(r, 5000))
      return submitOne(taskId, filePath, problemName, retries - 1)
    }
    console.error(`  FAIL: no CSRF token`)
    return false
  }
  const csrfToken = csrfMatch[1]

  const code = readFileSync(filePath, 'utf-8')

  const boundary = '----FormBoundary7MA4YWxkTrZu0gW'
  const filename = `${slugify(problemName)}.cpp`

  let body = ''
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="csrf_token"\r\n\r\n${csrfToken}\r\n`
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="task"\r\n\r\n${taskId}\r\n`
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`
  body += `Content-Type: text/plain\r\n\r\n${code}\r\n`
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="lang"\r\n\r\nC++\r\n`
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="option"\r\n\r\nC++17\r\n`
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="type"\r\n\r\ncourse\r\n`
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="target"\r\n\r\nproblemset\r\n`
  body += `--${boundary}--\r\n`

  const postRes = await fetch('https://cses.fi/course/send.php', {
    method: 'POST',
    headers: {
      cookie: sessionCookie,
      'user-agent': 'cses-automation',
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
    redirect: 'manual',
  })

  const location = postRes.headers.get('location')
  if (location) {
    console.log(`  OK -> redirected`)
    return true
  }

  const text = await postRes.text()
  // CSES returns 200 with "compiling..." message on success too
  if (text.length < 500 || text.includes('compilation') || text.includes('pending')) {
    console.log(`  OK (status=${postRes.status})`)
    return true
  }

  console.error(`  FAIL: status=${postRes.status}, body=${text.slice(0, 200)}`)
  return false
}

async function main() {
  await fetchSolvedTasks()

  const categories = loadProblems()

  let submitted = 0
  let skipped = 0
  let failed = 0
  let notFound = 0

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]

    for (const prob of cat.problems) {
      if (solvedIds.has(prob.id)) {
        skipped++
        continue
      }

      const filePath = ensureWoowoowooFile(i, cat.name, prob.name)
      if (!filePath) {
        notFound++
        console.log(`[miss] ${cat.name} / ${prob.name} (${prob.id}) — no solution file`)
        continue
      }

      const ok = await submitOne(prob.id, filePath, prob.name)
      if (ok) {
        submitted++
      } else {
        failed++
      }

      await new Promise(r => setTimeout(r, 2500))
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`already solved: ${skipped}`)
  console.log(`submitted:      ${submitted}`)
  console.log(`failed:         ${failed}`)
  console.log(`not found:      ${notFound}`)
}

main().catch(console.error)
