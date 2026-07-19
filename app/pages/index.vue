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
      <h1 class="topic-title">
        <NuxtLink to="/round">我們三個，邀請你打一場 CSES Weekly Round</NuxtLink>
      </h1>

      <div class="topic-info">
        By
        <span class="cf-handle" :style="{ color: handleStyle('zyo').color }">zyo</span>,
        <span class="cf-handle" :style="{ color: handleStyle('lukewu').color }">lukewu</span>,
        <span class="cf-handle" :style="{ color: handleStyle('Weeeeeeeeeeeee00').color }">Weeeeeeeeeeeee00</span>,
        3 hours ago
      </div>

      <div class="topic-body">
        <p>各位好，</p>
        <p>
          我們三個——<span class="cf-handle" :style="{ color: handleStyle('zyo').color }">zyo</span>、<span
            class="cf-handle" :style="{ color: handleStyle('lukewu').color }">lukewu</span>、<span class="cf-handle"
            :style="{ color: handleStyle('Weeeeeeeeeeeee00').color }">Weeeeeeeeeeeee00</span>——每週固定挑一組
          CSES 題目，開一場自己的 mini round，互相追進度、對送出紀錄、留解題筆記。這週的位子幫你留好了，<strong>來一起打吧。</strong>
        </p>

        <ul class="invite-facts">
          <li>
            本週題數：<strong>{{ liveCount ?? '一組精選' }}</strong><template v-if="liveCount"> 題</template>
            · 主題涵蓋 DP / 圖論 / 資料結構
          </li>
          <li>截止時間：<strong>{{ liveDeadline ?? '見賽區公告' }}</strong></li>
          <li>逐題勾狀態、看彼此的送出紀錄與解題筆記，卡住就標記 stuck 一起 debug</li>
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

        <p>準備好了嗎？點下面進賽區看即時賽況。</p>

        <NuxtLink to="/round" class="cf-enter-btn">進入賽區（Enter round）</NuxtLink>
      </div>

      <div class="topic-tags">
        <a v-for="t in inviteTags" :key="t" class="cf-tag">{{ t }}</a>
      </div>

      <div class="topic-footer">
        <span class="cf-vote">
          <span class="v-up">&#9650;</span>
          <span class="v-score">+137</span>
          <span class="v-down">&#9660;</span>
        </span>
        <div class="footer-meta">
          <NuxtLink to="/round" class="read-more">Read more »</NuxtLink>
          <span class="cf-comments">» 12 comments</span>
        </div>
      </div>
    </article>

    <!-- Announcement post -->
    <article class="cf-topic">
      <h2 class="topic-title small">
        <NuxtLink to="/round">系統公告：解題筆記與卡題標記已上線</NuxtLink>
      </h2>
      <div class="topic-info">
        By <span class="cf-handle" :style="{ color: handleStyle('lukewu').color }">lukewu</span>, yesterday
      </div>
      <div class="topic-body">
        <p>
          點任一格子即可查看該人的送出紀錄，並直接寫下這題的解題筆記；卡住的話打開「卡題標記」，隊友一眼就能看到誰需要救援。到
          <NuxtLink to="/plan">規劃</NuxtLink> 頁還能安排下一場的題單與待辦作業。
        </p>
      </div>
      <div class="topic-tags">
        <a class="cf-tag">announcement</a>
        <a class="cf-tag">notes</a>
      </div>
      <div class="topic-footer">
        <span class="cf-vote">
          <span class="v-up">&#9650;</span>
          <span class="v-score">+42</span>
          <span class="v-down">&#9660;</span>
        </span>
        <div class="footer-meta">
          <span class="cf-comments">» 3 comments</span>
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
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--cf-sep);
}

.topic-title {
  margin: 0 0 0.4rem;
  font-size: 1.7rem;
  font-weight: 400;
  line-height: 1.25;
}
.topic-title.small {
  font-size: 1.3rem;
}
.topic-title a {
  color: var(--cf-blue);
}

.topic-info {
  font-size: 0.82rem;
  color: var(--cs-text-muted);
  margin-bottom: 0.9rem;
}

.cf-handle {
  font-weight: 700;
}
.cf-handle:hover {
  text-decoration: underline;
  cursor: default;
}

.topic-body {
  font-size: 0.95rem;
  line-height: 1.65;
  color: #000;
}
.topic-body p {
  margin: 0 0 0.85rem;
}

.invite-facts {
  margin: 0 0 1rem;
  padding-left: 1.4rem;
}
.invite-facts li {
  margin: 0.3rem 0;
}

.live-standings {
  border: 1px solid var(--cf-border);
  border-radius: var(--cs-radius);
  padding: 0.75rem 0.9rem;
  margin: 0 0 1rem;
  background: var(--cf-cell);
}
.ls-caption {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--cs-text-secondary);
  margin-bottom: 0.5rem;
}
.ls-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.3rem 0;
  font-size: 0.85rem;
}
.ls-row .cf-handle {
  width: 9rem;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ls-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 2px;
  background: var(--cs-border-subtle);
  overflow: hidden;
}
.ls-bar-fill {
  display: block;
  height: 100%;
}
.ls-count {
  width: 3.5rem;
  text-align: right;
  color: var(--cs-text-secondary);
  flex-shrink: 0;
}

.cf-enter-btn {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: #3b5998;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: 4px;
  border: 1px solid #2f477a;
}
.cf-enter-btn:hover {
  background: #34508a;
  text-decoration: none;
}

.topic-tags {
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.cf-tag {
  font-size: 0.8rem;
  color: var(--cf-link);
  cursor: default;
}
.cf-tag::before {
  content: '#';
  opacity: 0.6;
}

.topic-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
}
.cf-vote {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
}
.v-up {
  color: var(--cs-accent);
  font-size: 0.75rem;
}
.v-score {
  font-weight: 700;
  color: var(--cs-accent);
}
.v-down {
  color: var(--cs-text-muted);
  font-size: 0.75rem;
}
.footer-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.82rem;
}
.cf-comments {
  color: var(--cf-link);
}
</style>
