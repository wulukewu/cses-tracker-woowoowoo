import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

async function processOne(taskId) {
  const testScript = `"${resolve(__dirname, 'test-problem.js')}"`
  const submitScript = `"${resolve(__dirname, 'submit-all.js')}"`

  // 1. Test with samples
  try {
    execSync(`node ${testScript} ${taskId}`, { stdio: 'pipe', timeout: 30000, cwd: ROOT })
  } catch (e) {
    const msg = e.stdout?.toString() || e.message
    if (msg.includes('PASS')) {
      // compile error or runtime error — indicate failure
      return { taskId, status: 'test_fail', detail: msg.slice(0, 200) }
    }
    // PASS but process.exit(1) for other reasons? fall through
  }

  // 2. Submit
  try {
    execSync(`node ${submitScript}`, { stdio: 'pipe', timeout: 120000, cwd: ROOT })
  } catch (e) {
    return { taskId, status: 'submit_error', detail: e.message.slice(0, 200) }
  }

  return { taskId, status: 'ok' }
}

const taskIds = process.argv.slice(2).map(Number).filter(Boolean)
if (taskIds.length === 0) {
  console.error('Usage: node process-problem.js <taskId> [taskId ...]')
  process.exit(1)
}

const results = []
for (const id of taskIds) {
  console.log(`\n=== Processing ${id} ===`)
  const r = await processOne(id)
  results.push(r)
  console.log(`Result: ${r.status}`)
}

console.log('\n=== Results ===')
for (const r of results) {
  console.log(`${r.taskId}: ${r.status}`)
}
