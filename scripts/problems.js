import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

export const CSES_USERNAME = 'woowoowoo'
export const CSES_USER_ID = '443609'
export const CP_BASE = resolve(ROOT, '../cp-code/cses/problemset')

export function loadProblems() {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/problems.json'), 'utf-8'))
}

export function slugify(name) {
  return name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
}

export function categoryDir(catIndex, catName) {
  const prefix = String(catIndex + 1)
  return `${prefix}_${slugify(catName)}`
}

export function woowoowooPath(catIndex, catName, problemName) {
  const dir = resolve(CP_BASE, categoryDir(catIndex, catName), 'woowoowoo')
  const filePath = resolve(dir, `${slugify(problemName)}.cpp`)
  return { dir, filePath }
}

export function mainDirPath(catIndex, catName, problemName) {
  const dir = resolve(CP_BASE, categoryDir(catIndex, catName))
  return resolve(dir, `${slugify(problemName)}.cpp`)
}
