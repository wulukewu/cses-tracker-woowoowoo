import * as cheerio from 'cheerio'
import { loadEnv } from './env.js'

const { sessionCookie } = loadEnv()
const CSES_USERNAME = 'woowoowoo'
const CSES_USER_ID = '443609'

const res = await fetch(`https://cses.fi/problemset/user/${CSES_USER_ID}/`, {
  headers: { cookie: sessionCookie, 'user-agent': 'cses-automation' },
})
const html = await res.text()
const $ = cheerio.load(html)

const taskScoreEls = $('a.task-score')
console.log(`total task-score elements: ${taskScoreEls.length}`)

const solvedIds = []
taskScoreEls.each((_, el) => {
  const classes = ($(el).attr('class') || '').split(/\s+/)
  if (classes.includes('full')) {
    const taskHref = $(el).attr('href') || ''
    const match = taskHref.match(/\/problemset\/task\/(\d+)/)
    if (match) solvedIds.push(Number(match[1]))
  }
})

console.log(`solved (${solvedIds.length}): [${solvedIds.sort((a,b)=>a-b).join(', ')}]`)
