/** Short, URL-safe, sufficiently-unique id for a personal-scale dataset (no collision handling needed). */
export function shortId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
