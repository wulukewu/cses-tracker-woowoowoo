// Randomised copy for the home feed. Each render pulls one fragment from every
// bucket, so the invitation post reads a little differently every time without
// ever changing meaning. No fixed "this week's topics" line — the scope varies
// round to round, so we don't claim one.

export interface InviteCopy {
  title: string
  intro: string
  /** follows "我們三個——<handles>——" */
  lead: string
  howItWorks: string
  /** precedes the call-to-action link */
  closing: string
  votes: number
  comments: number
}

export interface AnnouncementCopy {
  label: string
  title: string
  body: string
  votes: number
  comments: number
}

const TITLES = [
  '我們三個，邀請你打一場 CSES Weekly Round',
  '本週 CSES Round 開賽，就差你一個',
  '三人賽區又開張，這場算你一份',
  '週賽時間到，這回換你上場',
  '位子幫你留好了，來打這場 CSES Round',
  'CSES Weekly Round 開始報名，缺你不可',
]

const INTROS = ['各位好，', '嘿，各位：', '好久不見，', '安安，', '傳送門開好了，']

const LEADS = [
  '每週固定挑一組 CSES 題目，開一場只屬於我們的 mini round。',
  '每個禮拜湊一批 CSES 題，關起門辦一場小型週賽。',
  '每週選幾題 CSES，揪成一場自家的練功賽。',
  '固定每週開一場 CSES 小賽，題目我們負責挑。',
  '每週都會生一組 CSES 題單，自己跑一場迷你 round。',
]

const HOWS = [
  '逐題追進度、互看送出紀錄、留下解題筆記，卡住就標記 stuck 讓隊友來救。',
  '一題一題比進度，翻彼此的 code 與筆記，卡關就掛個 stuck 等人支援。',
  '即時對每題狀態、共享送出紀錄與解法思路，遇到坎標一下 stuck 就有人來陪你 debug。',
  '大家同場較勁進度、互相參考送出紀錄跟筆記，撞牆時標 stuck 求救。',
]

const CLOSINGS = [
  '這週的位子還空著，',
  '賽區已經開好，',
  '就等你一個，',
  '別讓我們三個唱獨角戲，',
  '手感正熱的話，',
]

const ANNOUNCEMENTS: Omit<AnnouncementCopy, 'votes' | 'comments'>[] = [
  {
    label: '公告',
    title: '解題筆記與卡題標記已上線',
    body: '點任一格子就能看該人的送出紀錄，並直接寫下這題的解題筆記；卡住的話打開「卡題標記」，隊友一眼就知道誰需要救援。',
  },
  {
    label: '功能',
    title: '現在可以逐題留筆記了',
    body: '每個人、每一題都有自己的筆記欄，順手把思路、踩到的坑、轉移式記下來，下次就不用重想一遍。',
  },
  {
    label: '更新',
    title: '排行榜改成即時抓取',
    body: '側邊的排行榜會即時抓三個人的解題數，誰在偷偷爆刷、誰還在暖身，一目了然。',
  },
]

/** deterministic seeded RNG (LCG) — same seed → same sequence on server + client */
export function makeRng(seed: number): () => number {
  let x = seed % 2147483647
  if (x <= 0) x += 2147483646
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!
}

export function buildInvite(rng: () => number): InviteCopy {
  return {
    title: pick(TITLES, rng),
    intro: pick(INTROS, rng),
    lead: pick(LEADS, rng),
    howItWorks: pick(HOWS, rng),
    closing: pick(CLOSINGS, rng),
    votes: 80 + Math.floor(rng() * 120),
    comments: 3 + Math.floor(rng() * 25),
  }
}

export function buildAnnouncement(rng: () => number): AnnouncementCopy {
  const a = pick(ANNOUNCEMENTS, rng)
  return { ...a, votes: 12 + Math.floor(rng() * 40), comments: 1 + Math.floor(rng() * 8) }
}
