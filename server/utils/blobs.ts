import { getStore } from './netlifyBlobs'
import type { Week, UserNote } from '~~/shared/types'

function weeksStore() {
  return getStore('weeks')
}

function metaStore() {
  return getStore('meta')
}

export async function listWeeks(): Promise<Week[]> {
  const store = weeksStore()
  const { blobs } = await store.list()
  const weeks = await Promise.all(
    blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<Week>),
  )
  return weeks
    .filter((w): w is Week => Boolean(w))
    .sort((a, b) => (b.deadline ?? '').localeCompare(a.deadline ?? ''))
}

export async function getWeek(id: string): Promise<Week | null> {
  const store = weeksStore()
  return (await store.get(id, { type: 'json' })) as Week | null
}

export async function saveWeek(week: Week): Promise<void> {
  const store = weeksStore()
  await store.setJSON(week.id, week)
}

export async function deleteWeek(id: string): Promise<void> {
  const store = weeksStore()
  await store.delete(id)
}

export async function deleteAllWeeks(): Promise<void> {
  const store = weeksStore()
  const { blobs } = await store.list()
  await Promise.all(blobs.map((b) => store.delete(b.key)))
}

export async function getStaleSince(): Promise<string | null> {
  const store = metaStore()
  const value = await store.get('staleSince', { type: 'text' })
  return value || null
}

export async function setStaleSince(date: string | null): Promise<void> {
  const store = metaStore()
  if (date === null) {
    await store.delete('staleSince')
  } else {
    await store.set('staleSince', date)
  }
}

function notesStore() {
  return getStore('notes')
}

const DEFAULT_NOTES: Record<string, Record<string, string>> = {
  "1633": { "lukewu": "題目 : 給n 問有幾種加法(3 = 1+1+1 = 1+2 = 2+1 = 3  4種)\n想法 : 有點像走樓梯 可以走1或2步 問有幾種走法那個\n\t   直覺想法從之前走的直接走到n 再加上0到n的步數1 也就是小於n的結果總和+1\n\t   更簡單的應該就是n-1的結果*2\n\t   因為n-1的結果是所有小於n-1的結果總和+1 再加上n-1 of results 就是 所有小於n的結果總和+1\n\t   然後記得 MOD 10^9+7\n\t   更:哈哈再不看題目阿 是丟骰子 走1~6 大於6的 扣掉n-7的結果 因為步數7的走不了\n\t   \t 或是直接加1~6的 就純粹DP" },
  "1634": { "lukewu": "題目 : 給n硬幣 硬幣有幣值 要達到x 問最少需要幾個硬幣\n想法 : 之前好像寫過 但思路好像不是DP\n\t   DP應該是 現在幣值的值設1 其他設MAX 以1 5 7為例\n\t   接著開始跑1~x 每個值為[i-1] [i-5] [i-7]項+1的最小值\n\t   之前好像是用最大的去填 不夠的再看能不能用剩下的填 但好像只有硬幣很少時可以這樣寫\n\t   更:DP預設要寫好 幣值超過的不能填 會爆" },
  "1635": { "lukewu": "題目 : 給n硬幣 硬幣有幣值 要達到x 問有幾種方法\n想法 : 感覺是前2題的結合 先這樣寫寫看 n<=100應該沒問題" },
  "1636": { "lukewu": "題目 : 給n硬幣 硬幣有幣值 要達到x 問有幾種不重複方法\n想法 : DP從0到x 預設1 然後[i+幣值]項 +[i]項的值\n\t   為了不重複 先加完同一種幣值 再換下一種" },
  "1637": { "lukewu": "題目 : 給n 可以n裡任意位數的值 問幾次到0\n想法 : 想不到DP 直覺是減最大的\n\t   更:0~n的DP 從最大開始減 每減一次次數+1 每個位數分開減 直到減到0 試試看\n\t   2更:可以不用從最大 預設0=0 1~9=1 往上長 假設[15] 就看[15-1/15-5]的最小值" },
  "1638": { "lukewu": "題目 : 給n*n地圖 有trap不能走 問左上到右下的走法數\n想法 : 二維DP 預設0 左上設定1 [i][j]為 [i-1][j]+[i][j-1] 有*就不跑\n\t   更:改為遇到*就設為0 確保起點/終點為*時 走法為0" },
  "1158": { "lukewu": "題目 : n本書 有x錢 每本書有價格 and 頁數 問最多能買到幾頁\n想法 : 有價值的背包問題 等等學一下\n\t   更:c(n, w) = max( c(n-1, w), c(n-1, w-weight[n]) + cost[n] )\n\t   \t n是第幾個物品 w是背包重量 其實算01背包 忘了" },
  "1746": { "lukewu": "題目 : n位數數列 相隔兩個差不會超過1 有幾個是未知0 問有幾種可能\n想法 : 每個0 從左邊推到右邊推3位 看最後面接的數字 判斷允許範圍?" },
  "2413": { "lukewu": "題目 : n層樓高 寬2層 有幾種建造方式\n想法 : 腦袋好空想不到\n\t   更:每層判斷兩種情況 連or不連 from wuwuwu\n\t   \t \t連:不管下面+與下面連(下面要连)\n\t   \t 不連:不管下面+與下面連的3種情形(左連/右連/左右連)(下面要不連)" },
  "1639": { "lukewu": "題目 : 給兩個string 可以取代 增加 減少字母 讓兩個一樣\n想法 : how to dp\n\t   更:依照改變方式分3種情況 from wuwuwu\n\t   2更:做n*m DP [i][j]代表A前i個字=B前j個字需要幾步\n\t    \t 不變: = [i-1][j-1]   (字母一樣 不用作動作)\n\t    \t 取代: = [i-1][j-1]+1 (直接改 不影響i j)\n\t    \t 增加: = [i][j-1]+1   (A加字 A[i-1]確定對應B[j-2] 所以看[i][j-1])\n\t    \t 減少: = [i-1][j]+1   (A減字 A[i-2]確定對應B[j-1] 所以看[i-1][j])" },
  "3403": { "lukewu": "題目 : 兩個int數列 找最長相同子序列(可以斷開)\n想法 : 欸之前好像寫過 但這是DP嗎" },
  "1744": { "lukewu": "題目 : a*b長方形 切成最少數量的正方形\n想法 : 跟最大公因數有關嗎 感覺" }
}

export function normalizeNotes(raw: Record<string, any>): Record<string, UserNote> {
  const normalized: Record<string, UserNote> = {}
  for (const [username, val] of Object.entries(raw)) {
    if (typeof val === 'string') {
      normalized[username] = { content: val, stuck: false }
    } else {
      normalized[username] = {
        content: val?.content ?? '',
        stuck: Boolean(val?.stuck),
      }
    }
  }
  return normalized
}

export async function listNotes(): Promise<Record<string, Record<string, UserNote>>> {
  const store = notesStore()
  const { blobs } = await store.list()
  
  if (blobs.length === 0) {
    const normalizedDefault: Record<string, Record<string, UserNote>> = {}
    for (const [id, contentMap] of Object.entries(DEFAULT_NOTES)) {
      const normalized = normalizeNotes(contentMap)
      await store.setJSON(id, normalized)
      normalizedDefault[id] = normalized
    }
    return normalizedDefault
  }

  const result: Record<string, Record<string, UserNote>> = {}
  await Promise.all(
    blobs.map(async (b) => {
      const contentMap = await store.get(b.key, { type: 'json' })
      if (contentMap !== null) {
        result[b.key] = normalizeNotes(contentMap as Record<string, any>)
      }
    })
  )
  return result
}

export async function getNote(problemId: string): Promise<Record<string, UserNote>> {
  const store = notesStore()
  const val = await store.get(problemId, { type: 'json' })
  const raw = val === null ? (DEFAULT_NOTES[problemId] || {}) : val
  return normalizeNotes(raw as Record<string, any>)
}

export async function saveNote(problemId: string, username: string, content: string, stuck: boolean = false): Promise<void> {
  const store = notesStore()
  const val = await getNote(problemId)
  
  if ((!content || content.trim() === '') && !stuck) {
    delete val[username]
  } else {
    val[username] = { content, stuck }
  }
  
  if (Object.keys(val).length === 0) {
    await store.delete(problemId)
  } else {
    await store.setJSON(problemId, val)
  }
}

export async function deleteNote(problemId: string): Promise<void> {
  const store = notesStore()
  await store.delete(problemId)
}

export async function deleteAllNotes(): Promise<void> {
  const store = notesStore()
  const { blobs } = await store.list()
  await Promise.all(blobs.map((b) => store.delete(b.key)))
}
