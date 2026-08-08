// 藍／黃點（最先解出、執行最快）的判定邏輯。
//
// 規格（2026-08 與 Luke 定案）：
// - 黃點 = 每人的"第一次 AC"時間最早者；同秒平手 → 並列全亮。
// - 藍點 = 每人在自己"所有 AC"中取執行時間最佳(最小)者；再跨人比這個最佳值，
//   同值平手 → 並列全亮。
// - 一律以 CSES 顯示值為準（執行時間 0.01s 小數、AC 時間秒粒度），不做額外精度拆分。
// - 只有 unlocked（scraper 帳號已解該題）且前置條件成立的使用者才參與。

import type { SubmissionsResponse } from './types'

export interface ProblemInsights {
  /** 每題最先解出者的使用者名（依 AC 時間說法，同一秒並列全列）。 */
  firstSolverNames: string[]
  /** 每題執行最快者的使用者名（各自最佳 AC 之執行時間，同值並列全列）。 */
  fastestNames: string[]
}

/** 從 CSES 顯示的執行時間字串（例如 "0.05 s" / "0.00 s"）取出秒數。
 * 帶前綴算子（"< 0.01 s"）或根本不含數字 → 回 null（不可當精確時間比較）。 */
function parseExecTimeSeconds(execTime: string): number | null {
  if (/^[<>]=?\s/.test(execTime)) return null
  const m = execTime.match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  return Number(m[1])
}

export function computeProblemInsights(
  problemId: string,
  users: ReadonlyArray<{ name: string }>,
  submissions: SubmissionsResponse,
): ProblemInsights {
  const firstCandidates: Array<{ name: string; firstAc: string }> = []
  const timingCandidates: Array<{ name: string; bestSec: number }> = []

  for (const user of users) {
    const summary = submissions[problemId]?.[user.name]
    if (!summary?.unlocked || !summary.firstAcTime) continue
    firstCandidates.push({ name: user.name, firstAc: summary.firstAcTime })

    let bestSec: number | null = null
    for (const s of summary.submissions) {
      if (s.verdict !== 'AC') continue
      const sec = parseExecTimeSeconds(s.execTime)
      if (sec !== null && (bestSec === null || sec < bestSec)) bestSec = sec
    }
    if (bestSec !== null) timingCandidates.push({ name: user.name, bestSec })
  }

  const firstSolverNames: string[] = []
  if (firstCandidates.length > 0) {
    let earliest = firstCandidates[0].firstAc
    for (const c of firstCandidates) if (c.firstAc < earliest) earliest = c.firstAc
    for (const c of firstCandidates) if (c.firstAc === earliest) firstSolverNames.push(c.name)
  }

  const fastestNames: string[] = []
  if (timingCandidates.length > 0) {
    let fastest = timingCandidates[0].bestSec
    for (const c of timingCandidates) if (c.bestSec < fastest) fastest = c.bestSec
    for (const c of timingCandidates) if (c.bestSec === fastest) fastestNames.push(c.name)
  }

  return { firstSolverNames, fastestNames }
}