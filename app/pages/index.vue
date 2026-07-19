<script setup lang="ts">
import type { ProgressResponse } from '~~/shared/types'

// Client-only, non-blocking, degrades to null. The tracker's blob-backed API
// can 500 outside a Netlify context — the home page must never break on that,
// it just falls back to generic copy.
const { data: live } = await useFetch<ProgressResponse | null>('/api/progress', {
  server: false,
  lazy: true,
  default: () => null,
})

const liveWeek = computed(() => live.value?.week ?? null)
const liveCount = computed(() => liveWeek.value?.problems.length ?? null)
const liveDeadline = computed(() =>
  liveWeek.value?.deadline ? formatDate(liveWeek.value.deadline) : null,
)

const liveStandings = computed(() => {
  const w = liveWeek.value
  const usrs = live.value?.users
  if (!w || !usrs) return []
  const ids = new Set(w.problems.map((p) => p.id))
  return usrs
    .map((u) => ({
      name: u.name,
      style: handleStyle(u.name),
      solved: u.solvedIds.filter((id) => ids.has(id)).length,
      total: w.problems.length,
    }))
    .sort((a, b) => b.solved - a.solved)
})

const inviteTags = ['cses', 'weekly-round', 'dp', 'graphs', '三人成團']
</script>

<template>
  <div class="cf-home">
    <!-- Invitation blog post -->
    <article class="cf-topic">
      <h1 class="cf-topic-title">
        <NuxtLink to="/round">我們三個，邀請你打一場 CSES Weekly Round 🎯</NuxtLink>
      </h1>

      <div class="cf-topic-info">
        By
        <span class="cf-handle" :style="{ color: handleStyle('zyo').color }">zyo</span>,
        <span class="cf-handle" :style="{ color: handleStyle('lukewu').color }">lukewu</span>,
        <span class="cf-handle" :style="{ color: handleStyle('Weeeeeeeeeeeee00').color }">Weeeeeeeeeeeee00</span>,
        3 hours ago
      </div>

      <div class="cf-topic-body">
        <p>Hi, Codeforces！<span class="whisper">（噓，其實是 CSES 🤫）</span></p>
        <p>
          我們三個——<span class="cf-handle" :style="{ color: handleStyle('zyo').color }">zyo</span>、<span
            class="cf-handle" :style="{ color: handleStyle('lukewu').color }">lukewu</span>、<span class="cf-handle"
            :style="{ color: handleStyle('Weeeeeeeeeeeee00').color }">Weeeeeeeeeeeee00</span>——每週固定挑一組
          CSES 題目，開一場自己的迷你 round，互相追進度、對送出紀錄、留解題筆記。這週的位子幫你留好了，<strong>來一起打吧！</strong>
        </p>

        <ul class="invite-facts">
          <li>
            📅 本週題數：<strong>{{ liveCount ?? '一組精選' }}</strong>
            <template v-if="liveCount"> 題</template> · 主題涵蓋 DP / 圖論 / 資料結構
          </li>
          <li>⏰ 截止時間：<strong>{{ liveDeadline ?? '見賽區公告' }}</strong></li>
          <li>🧠 逐題勾狀態、看彼此送出紀錄與解題筆記、卡住就標記 <em>stuck</em> 一起 debug</li>
        </ul>

        <div v-if="liveStandings.length" class="live-standings">
          <div class="ls-caption">目前賽況（即時）</div>
          <div v-for="s in liveStandings" :key="s.name" class="ls-row">
            <span class="cf-handle" :style="{ color: s.style.color }">{{ s.name }}</span>
            <span class="ls-bar-track">
              <span class="ls-bar-fill" :style="{ width: `${s.total ? (s.solved / s.total) * 100 : 0}%`, background: s.style.color }" />
            </span>
            <span class="ls-count">{{ s.solved }} / {{ s.total }}</span>
          </div>
        </div>

        <p>準備好了嗎？點下面進賽區看即時賽況 👇</p>

        <NuxtLink to="/round" class="cf-enter-btn">→ 進入賽區（Enter round）</NuxtLink>
      </div>

      <div class="cf-topic-tags">
        <a v-for="t in inviteTags" :key="t" class="cf-tag"># {{ t }}</a>
      </div>

      <div class="cf-topic-footer">
        <span class="cf-vote">
          <span class="v-up">▲</span>
          <span class="v-score">+137</span>
          <span class="v-down">▼</span>
        </span>
        <div class="cf-footer-meta">
          <NuxtLink to="/round" class="read-more">Read more »</NuxtLink>
          <span class="cf-comments">💬 12</span>
        </div>
      </div>
    </article>

    <!-- Announcement post -->
    <article class="cf-topic announcement">
      <h2 class="cf-topic-title small">
        <NuxtLink to="/round">系統公告：解題筆記 &amp; 卡題標記已上線</NuxtLink>
      </h2>
      <div class="cf-topic-info">
        By <span class="cf-handle" :style="{ color: handleStyle('lukewu').color }">lukewu</span>, yesterday
      </div>
      <div class="cf-topic-body">
        <p>
          點任一格子即可查看該人的送出紀錄，並直接寫下這題的解題筆記；卡住的話打開「卡題標記」，隊友一眼就能看到誰需要救援。到
          <NuxtLink to="/plan">規劃</NuxtLink> 頁還能安排下一場的題單與待辦作業。
        </p>
      </div>
      <div class="cf-topic-tags">
        <a class="cf-tag"># announcement</a>
        <a class="cf-tag"># notes</a>
      </div>
      <div class="cf-topic-footer">
        <span class="cf-vote">
          <span class="v-up">▲</span>
          <span class="v-score">+42</span>
          <span class="v-down">▼</span>
        </span>
        <div class="cf-footer-meta">
          <span class="cf-comments">💬 3</span>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.cf-home {
  display: flex;
  flex-direction: column;
}

.cf-topic {
  background: var(--cs-bg);
  border: 1px solid var(--cf-box-border);
  border-radius: 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.25rem;
  overflow: hidden;
}

.cf-topic-title {
  margin: 0;
  padding: 1rem 1.25rem 0.15rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}

.cf-topic-title.small {
  font-size: 1.2rem;
}

.cf-topic-title a {
  color: var(--cf-link);
  text-decoration: none;
}

.cf-topic-title a:hover {
  text-decoration: underline;
}

.cf-topic-info {
  padding: 0 1.25rem 0.75rem;
  font-size: 0.82rem;
  color: var(--cs-text-muted);
  border-bottom: 1px solid var(--cs-border-subtle);
}

.cf-handle {
  font-weight: 700;
}
.cf-handle:hover {
  text-decoration: underline;
  cursor: default;
}

.cf-topic-body {
  padding: 1rem 1.25rem;
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--cs-text);
}

.cf-topic-body p {
  margin: 0 0 0.85rem;
}

.whisper {
  color: var(--cs-text-muted);
  font-size: 0.85em;
}

.invite-facts {
  margin: 0 0 1rem;
  padding-left: 1.2rem;
  list-style: none;
}

.invite-facts li {
  margin: 0.35rem 0;
  padding-left: 0.2rem;
}

.live-standings {
  border: 1px solid var(--cf-box-border);
  border-radius: var(--cs-radius);
  padding: 0.75rem 0.9rem;
  margin: 0 0 1rem;
  background: var(--cs-bg-subtle);
}

.ls-caption {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--cs-text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.ls-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.3rem 0;
  font-size: 0.85rem;
}

.ls-row .cf-handle {
  width: 8.5rem;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ls-bar-track {
  flex: 1;
  height: 7px;
  border-radius: 999px;
  background: var(--cs-border-subtle);
  overflow: hidden;
}

.ls-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.ls-count {
  width: 3.5rem;
  text-align: right;
  color: var(--cs-text-secondary);
  flex-shrink: 0;
}

.cf-enter-btn {
  display: inline-block;
  margin-top: 0.3rem;
  padding: 0.55rem 1.3rem;
  background: linear-gradient(#4a70b0, #3b5998);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  border-radius: 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.cf-enter-btn:hover {
  filter: brightness(1.08);
}

.cf-topic-tags {
  padding: 0.5rem 1.25rem 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.cf-tag {
  font-size: 0.8rem;
  color: var(--cf-link);
  text-decoration: none;
  cursor: default;
}

.cf-tag:hover {
  text-decoration: underline;
}

.cf-topic-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1.25rem;
  background: var(--cf-caption-bg);
  border-top: 1px solid var(--cf-box-border);
}

.cf-vote {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.v-up {
  color: var(--cs-accent);
}
.v-score {
  font-weight: 700;
  color: var(--cs-accent);
}
.v-down {
  color: var(--cs-text-muted);
}

.cf-footer-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.82rem;
}

.read-more {
  color: var(--cf-link);
  text-decoration: none;
}
.read-more:hover {
  text-decoration: underline;
}

.cf-comments {
  color: var(--cs-text-secondary);
}
</style>
