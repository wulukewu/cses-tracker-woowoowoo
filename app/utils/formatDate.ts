function isHelsinkiDst(year: number, month: number, day: number, hour: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day, hour, 0, 0))

  const dstStart = new Date(Date.UTC(year, 2, 31))
  dstStart.setUTCDate(dstStart.getUTCDate() - dstStart.getUTCDay())
  dstStart.setUTCHours(1, 0, 0, 0)

  const dstEnd = new Date(Date.UTC(year, 9, 31))
  dstEnd.setUTCDate(dstEnd.getUTCDate() - dstEnd.getUTCDay())
  dstEnd.setUTCHours(1, 0, 0, 0)

  return date >= dstStart && date < dstEnd
}

export function csesTimeToTaiwan(csesTime: string): string {
  const [datePart, timePart] = csesTime.split(' ')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, min, ss] = timePart.split(':').map(Number)

  const dst = isHelsinkiDst(y, m, d, hh)
  const helsinkiOffset = dst ? 3 : 2

  const utcMs = Date.UTC(y, m - 1, d, hh - helsinkiOffset, min, ss)
  const taiwanMs = utcMs + 8 * 3600000
  const t = new Date(taiwanMs)

  const Y = t.getUTCFullYear()
  const M = String(t.getUTCMonth() + 1).padStart(2, '0')
  const D = String(t.getUTCDate()).padStart(2, '0')
  const H = String(t.getUTCHours()).padStart(2, '0')
  const Mi = String(t.getUTCMinutes()).padStart(2, '0')
  const S = String(t.getUTCSeconds()).padStart(2, '0')

  return `${Y}-${M}-${D} ${H}:${Mi}:${S}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}