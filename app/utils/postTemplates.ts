// Copy for the home feed. Each week becomes one post; the wording is picked
// from equivalent-meaning pools seeded by the week id, so different weeks read
// differently but a given week always reads the same (stable across refreshes).
// "Lively" lives in the wording — the layout stays plain like a Codeforces blog.

export interface PostCopy {
  title: string
  intro: string
  /** follows "我們三個——<handles>——" */
  lead: string
  how: string
  /** precedes the call-to-action link */
  closing: string
  cta: string
  votes: number
  comments: number
}

const INTROS = ['各位好，', '嘿，各位：', '好久不見，', '安安，', '傳送門開好了，']

// --- invitation voice (the current / active week) ---
const INV_TITLES = [
  '我們三個，邀請你打一場 CSES Weekly Round',
  '本週 CSES Round 開賽，就差你一個',
  '三人賽區又開張，這場算你一份',
  '週賽開跑，這回換你上場',
  '手癢了嗎？這場 CSES Round 等你',
  'CSES Weekly Round 開始報名，缺你不可',
]
const INV_LEADS = [
  '每週固定挑一組 CSES 題目，開一場只屬於我們的 mini round。',
  '每個禮拜湊一批 CSES 題，關起門辦一場小型週賽。',
  '每週選幾題 CSES，揪成一場自家的練功賽。',
  '固定每週開一場 CSES 小賽，題目我們負責挑。',
  '每週都生一組 CSES 題單，自己跑一場迷你 round。',
]
const INV_HOWS = [
  '逐題追進度、互看送出紀錄、留下解題筆記，卡住就標記 stuck 讓隊友來救。',
  '一題一題比進度，翻彼此的 code 與筆記，卡關就掛個 stuck 等人支援。',
  '即時對每題狀態、共享送出紀錄與解法思路，遇到坎標一下 stuck 就有人陪你 debug。',
  '大家同場尬進度、互相參考送出紀錄跟筆記，撞牆時標 stuck 求救。',
]
const INV_CLOSINGS = [
  '這週的位子還空著，',
  '賽區已經開好，',
  '就等你一個，',
  '別讓我們三個唱獨角戲，',
  '手感正熱的話，',
]

// --- recap voice (past weeks) ---
const REC_TITLES = [
  '這場 Round 打完了，戰報收一下',
  '上一場 CSES Round 賽後回顧',
  '一週練習收工，成績單在這',
  '這週的題單，我們這樣收尾',
  'Round 結束，戰況攤開來看',
]
const REC_LEADS = [
  '這週的 CSES 題單告一段落了。',
  '本週這組題我們打完收工。',
  '這一輪 CSES 練習正式結束。',
  '這週的迷你 round 跑完啦。',
]
const REC_HOWS = [
  '過程照舊：逐題比進度、互看送出紀錄與筆記，卡題就標 stuck 互相救援。',
  '一如往常，邊比進度邊翻彼此的 code 與筆記，卡關就掛 stuck 求救。',
  '老規矩，逐題對狀態、共享解法思路，撞牆時標個 stuck 等人支援。',
]
const REC_CLOSINGS = [
  '想看完整戰況，',
  '每一題的送出紀錄與筆記都在裡面，',
  '細節都記在賽區了，',
  '成績單與筆記都在這，',
]

/** deterministic seeded RNG (LCG) — same seed → same sequence */
export function makeRng(seed: number): () => number {
  let x = Math.abs(seed) % 2147483647
  if (x <= 0) x += 2147483646
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

/** stable hash of a string → seed number */
export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!
}

export function buildPost(rng: () => number, voice: 'invite' | 'recap'): PostCopy {
  const inv = voice === 'invite'
  return {
    title: pick(inv ? INV_TITLES : REC_TITLES, rng),
    intro: pick(INTROS, rng),
    lead: pick(inv ? INV_LEADS : REC_LEADS, rng),
    how: pick(inv ? INV_HOWS : REC_HOWS, rng),
    closing: pick(inv ? INV_CLOSINGS : REC_CLOSINGS, rng),
    cta: inv ? '進入賽區看即時賽況 »' : '進入賽區看完整戰況 »',
    votes: 40 + Math.floor(rng() * 140),
    comments: 2 + Math.floor(rng() * 26),
  }
}
