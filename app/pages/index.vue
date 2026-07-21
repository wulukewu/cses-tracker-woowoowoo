<script setup lang="ts">
import type { ProgressResponse } from '~~/shared/types'
import { makeRng, buildInvite, buildAnnouncement } from '~/utils/postTemplates'

// One random seed per render, shared server→client via useState so the
// randomised copy is identical on both sides (no hydration mismatch) but
// fresh on every fresh load.
const seed = useState('homeSeed', () => Math.floor(Math.random() * 2_000_000_000))
const rng = makeRng(seed.value)
const invite = buildInvite(rng)
const announcement = buildAnnouncement(rng)
const inviteHoursAgo = 1 + Math.floor(rng() * 8)

const inviteTags = ['cses', 'weekly-round', '練功', '三人成團']

// Client-only, non-blocking, degrades to null — the home page must never break
// if the blob-backed API is unavailable. Powers the (kept) live standings.
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
      solved: u.solvedIds.filter((id) => ids.has(id)).length,
      total: w.problems.length,
    }))
    .sort((a, b) => b.solved - a.solved)
})
</script>

<template>
  <div class="cf-home">
    <!-- Invitation post (randomised copy) -->
    <article class="cf-topic">
      <div class="topic-head">
        <span class="post-label label-round">週賽</span>
        <h2 class="topic-title">
          <NuxtLink to="/round">{{ invite.title }}</NuxtLink>
        </h2>
      </div>

      <div class="topic-info">
        By
        <LayoutCfHandle name="zyo" />,
        <LayoutCfHandle name="lukewu" />,
        <LayoutCfHandle name="Weeeeeeeeeeeee00" />,
        {{ inviteHoursAgo }} hours ago
      </div>

      <div class="topic-body">
        <p>{{ invite.intro }}</p>
        <p>
          我們三個——<LayoutCfHandle name="zyo" />、<LayoutCfHandle name="lukewu" />、<LayoutCfHandle
            name="Weeeeeeeeeeeee00" />——{{ invite.lead }}
        </p>
        <p>{{ invite.howItWorks }}</p>

        <p class="post-meta-line">
          <span class="meta-chip">本週 <strong>{{ liveCount ?? '題單準備中' }}</strong><template v-if="liveCount"> 題</template></span>
          <span class="meta-chip">截止 <strong>{{ liveDeadline ?? '見賽區公告' }}</strong></span>
        </p>

        <div v-if="liveStandings.length" class="live-standings">
          <div class="ls-caption">目前賽況（即時）</div>
          <div v-for="s in liveStandings" :key="s.name" class="ls-row">
            <LayoutCfHandle :name="s.name" class="ls-handle" />
            <span class="ls-bar-track">
              <span class="ls-bar-fill" :style="{ width: `${s.total ? (s.solved / s.total) * 100 : 0}%` }" />
            </span>
            <span class="ls-count">{{ s.solved }} / {{ s.total }}</span>
          </div>
        </div>

        <p class="post-cta-line">
          {{ invite.closing }}<NuxtLink to="/round" class="post-cta">進入賽區看即時賽況 »</NuxtLink>
        </p>
      </div>

      <div class="topic-tags">
        <a v-for="t in inviteTags" :key="t" class="cf-tag">{{ t }}</a>
      </div>

      <div class="topic-footer">
        <span class="cf-vote">
          <span class="v-up">&#9650;</span>
          <span class="v-score">+{{ invite.votes }}</span>
          <span class="v-down">&#9660;</span>
        </span>
        <div class="footer-meta">
          <NuxtLink to="/round" class="read-more">Read more »</NuxtLink>
          <span class="cf-comments">» {{ invite.comments }} comments</span>
        </div>
      </div>
    </article>

    <!-- Announcement post -->
    <article class="cf-topic">
      <div class="topic-head">
        <span class="post-label label-news">{{ announcement.label }}</span>
        <h2 class="topic-title small">
          <NuxtLink to="/round">{{ announcement.title }}</NuxtLink>
        </h2>
      </div>
      <div class="topic-info">
        By <LayoutCfHandle name="lukewu" />, yesterday
      </div>
      <div class="topic-body">
        <p>{{ announcement.body }}</p>
        <p class="post-cta-line">
          想排下一場？<NuxtLink to="/plan" class="post-cta">到「規劃」安排題單與待辦 »</NuxtLink>
        </p>
      </div>
      <div class="topic-tags">
        <a class="cf-tag">announcement</a>
        <a class="cf-tag">notes</a>
      </div>
      <div class="topic-footer">
        <span class="cf-vote">
          <span class="v-up">&#9650;</span>
          <span class="v-score">+{{ announcement.votes }}</span>
          <span class="v-down">&#9660;</span>
        </span>
        <div class="footer-meta">
          <span class="cf-comments">» {{ announcement.comments }} comments</span>
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

.topic-head {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.post-label {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.1rem 0.5rem;
  border-radius: 2px;
  transform: translateY(-0.15rem);
}
.label-round {
  background: #e7eefb;
  color: #3b5998;
  border: 1px solid #c9d6ef;
}
.label-news {
  background: #e9f3e9;
  color: #008000;
  border: 1px solid #cfe6cf;
}

.topic-title {
  margin: 0 0 0.4rem;
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 1.25;
}
.topic-title.small {
  font-size: 1.25rem;
}
.topic-title a {
  color: var(--cf-blue);
}

.topic-info {
  font-size: 0.82rem;
  color: var(--cs-text-muted);
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

.post-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.meta-chip {
  background: var(--cf-cell);
  border: 1px solid var(--cf-sep);
  border-radius: 3px;
  padding: 0.12rem 0.55rem;
  font-size: 0.85rem;
}

.post-cta {
  color: var(--cf-link);
  font-weight: 700;
  text-decoration: underline;
}
.post-cta:hover {
  color: #24428a;
}
.post-cta-line {
  margin-top: 0.9rem;
}

.live-standings {
  border: 1px solid var(--cf-border);
  border-radius: var(--cs-radius);
  padding: 0.75rem 0.9rem;
  margin: 0 0 0.9rem;
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
.ls-handle {
  width: 9rem;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: var(--cs-accent);
}
.ls-count {
  width: 3.5rem;
  text-align: right;
  color: var(--cs-text-secondary);
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
.read-more {
  color: var(--cf-link);
}
.cf-comments {
  color: var(--cf-link);
}
</style>
