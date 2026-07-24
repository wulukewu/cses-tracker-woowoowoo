<script setup lang="ts">
import type { ProgressResponse, Week } from '~~/shared/types'
import { makeRng, hashSeed, buildPost } from '~/utils/postTemplates'

// Weeks drive the feed (one post per week). Fetched on the server so the posts
// are in the initial HTML; degrades to [] if the blob backend is unavailable.
const { data: weeksData } = await useFetch<Week[]>('/api/weeks', { default: () => [] })

// Progress (solved counts) is client-only + non-blocking — powers the standings
// without triggering a CSES scrape during SSR.
const { data: live } = await useFetch<ProgressResponse | null>('/api/progress', {
  server: false,
  lazy: true,
  default: () => null,
})

const INV_TAGS = ['cses', 'weekly-round', '練功', '三人成團']
const REC_TAGS = ['cses', 'recap', '週賽']

const FALLBACK: Week = { id: 'preview', createdAt: '', deadline: null, problems: [] }

const posts = computed(() => {
  const weeks = (weeksData.value?.length ? weeksData.value : [FALLBACK])
  const us = live.value?.users ?? []
  return weeks.map((w, i) => {
    const voice = i === 0 ? 'invite' : 'recap'
    const rng = makeRng(hashSeed(`${w.id}|${i}|${voice}`))
    const copy = buildPost(rng, voice)
    const time = i === 0 ? `${1 + Math.floor(rng() * 8)} hours ago` : `${i} 週前`
    const total = w.problems?.length ?? 0
    const ids = new Set((w.problems ?? []).map((p) => p.id))
    const standings =
      us.length && total
        ? us
            .map((u) => ({
              name: u.name,
              solved: u.solvedIds.filter((id) => ids.has(id)).length,
              total,
            }))
            .sort((a, b) => b.solved - a.solved)
        : []
    return {
      id: w.id,
      copy,
      time,
      count: total || null,
      deadline: w.deadline ? formatDate(w.deadline) : null,
      standings,
      standingsLabel: i === 0 ? '目前賽況（即時）' : '最終賽況',
      tags: voice === 'invite' ? INV_TAGS : REC_TAGS,
    }
  })
})
</script>

<template>
  <div class="cf-home">
    <article v-for="post in posts" :key="post.id" class="cf-topic">
      <h2 class="topic-title">
        <NuxtLink to="/round">{{ post.copy.title }}</NuxtLink>
      </h2>

      <div class="topic-info">
        By
        <LayoutCfHandle name="zyo" />,
        <LayoutCfHandle name="lukewu" />,
        <LayoutCfHandle name="Weeeeeeeeeeeee00" />,
        {{ post.time }}
      </div>

      <div class="topic-body">
        <p>{{ post.copy.intro }}</p>
        <p>
          我們三個——<LayoutCfHandle name="zyo" />、<LayoutCfHandle name="lukewu" />、<LayoutCfHandle
            name="Weeeeeeeeeeeee00" />——{{ post.copy.lead }}
        </p>
        <p>{{ post.copy.how }}</p>

        <p v-if="post.count || post.deadline">
          本週 <strong>{{ post.count ?? '題單準備中' }}</strong><template v-if="post.count"> 題</template><template
            v-if="post.deadline">，截止 <strong>{{ post.deadline }}</strong></template>。
        </p>

        <div v-if="post.standings.length" class="standings">
          <div class="standings-cap">{{ post.standingsLabel }}</div>
          <div v-for="s in post.standings" :key="s.name" class="standings-row">
            <LayoutCfHandle :name="s.name" class="st-handle" />
            <span class="st-bar"><span class="st-fill" :style="{ width: `${s.total ? (s.solved / s.total) * 100 : 0}%` }" /></span>
            <span class="st-count">{{ s.solved }} / {{ s.total }}</span>
          </div>
        </div>

        <p class="post-cta-line">
          {{ post.copy.closing }}<NuxtLink to="/round" class="post-cta">{{ post.copy.cta }}</NuxtLink>
        </p>
      </div>

      <div class="topic-tags">
        <a v-for="t in post.tags" :key="t" class="cf-tag">{{ t }}</a>
      </div>

      <div class="topic-footer">
        <span class="cf-vote">
          <span class="v-up">&#9650;</span>
          <span class="v-score">+{{ post.copy.votes }}</span>
          <span class="v-down">&#9660;</span>
        </span>
        <div class="footer-meta">
          <NuxtLink to="/round" class="read-more">Read more »</NuxtLink>
          <span class="cf-comments">» {{ post.copy.comments }} comments</span>
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
  margin: 0 0 0.35rem;
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 1.25;
}
.topic-title a {
  color: var(--cf-blue);
}

.topic-info {
  font-size: 0.82rem;
  color: var(--cf-text-muted);
  margin-bottom: 0.9rem;
}

.topic-body {
  font-size: 0.95rem;
  line-height: 1.65;
  color: #000;
}
.topic-body p {
  margin: 0 0 0.8rem;
}

.post-cta {
  color: var(--cf-link);
  text-decoration: underline;
}
.post-cta:hover {
  color: #24428a;
}
.post-cta-line {
  margin-top: 0.9rem;
}

/* Live standings — kept, but plain (no boxed decoration) */
.standings {
  margin: 0 0 0.8rem;
}
.standings-cap {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--cf-text-secondary);
  margin-bottom: 0.4rem;
}
.standings-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.25rem 0;
  font-size: 0.85rem;
}
.st-handle {
  width: 9rem;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.st-bar {
  flex: 1;
  max-width: 22rem;
  height: 8px;
  border-radius: 2px;
  background: var(--cf-sep);
  overflow: hidden;
}
.st-fill {
  display: block;
  height: 100%;
  background: var(--cf-accent);
}
.st-count {
  width: 3.5rem;
  text-align: right;
  color: var(--cf-text-secondary);
  flex-shrink: 0;
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
  color: var(--cf-accent);
  font-size: 0.75rem;
}
.v-score {
  font-weight: 700;
  color: var(--cf-accent);
}
.v-down {
  color: var(--cf-text-muted);
  font-size: 0.75rem;
}
.footer-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.82rem;
}
.read-more {
  color: var(--cf-link);
}
.cf-comments {
  color: var(--cf-link);
}
</style>
