import { existsSync } from 'fs'
import { resolve } from 'path'
import * as cheerio from 'cheerio'
import { loadEnv } from './env.js'
import { loadProblems, slugify, categoryDir, CSES_USER_ID, CP_BASE } from './problems.js'

const { sessionCookie } = loadEnv()
const categories = loadProblems()

const res = await fetch(`https://cses.fi/problemset/user/${CSES_USER_ID}/`, {
  headers: { cookie: sessionCookie, 'user-agent': 'cses-automation' },
})
const html = await res.text()
const $ = cheerio.load(html)

const solvedIds = new Set()
$('a.task-score').each((_, el) => {
  const classes = ($(el).attr('class') || '').split(/\s+/)
  if (classes.includes('full')) {
    const href = $(el).attr('href') || ''
    const match = href.match(/\/problemset\/task\/(\d+)/)
    if (match) solvedIds.add(Number(match[1]))
  }
})

console.log(`solved: ${solvedIds.size} tasks\n`)

for (let i = 0; i < categories.length; i++) {
  const cat = categories[i]
  const catDirName = categoryDir(i, cat.name)
  const unsolved = []

  for (const prob of cat.problems) {
    if (solvedIds.has(prob.id)) continue
    unsolved.push(prob)
  }

  if (unsolved.length === 0) {
    console.log(`${cat.name}: ALL DONE`)
    continue
  }

  console.log(`\n${cat.name} (${unsolved.length} unsolved, dir=${catDirName}):`)
  for (const prob of unsolved) {
    const probSlug = slugify(prob.name)
    const wPath = `${catDirName}/woowoowoo/${probSlug}.cpp`
    const mPath = `${catDirName}/${probSlug}.cpp`
    const hasWoo = existsSync(resolve(CP_BASE, catDirName, 'woowoowoo', `${probSlug}.cpp`))
    const hasMain = existsSync(resolve(CP_BASE, catDirName, `${probSlug}.cpp`))

    let status = '[ ]'
    if (hasWoo) status = '[W]'
    else if (hasMain) status = '[M]'

    console.log(`  ${status} ${prob.name} (${prob.id})`)
  }
}
