// Codeforces-style handle colouring. Each tracked user is given a fictional
// rating + tier purely for the skin — it doesn't feed any real logic, it just
// drives the coloured handle look that makes the site read as Codeforces.

export interface HandleStyle {
  /** cosmetic rating shown next to the handle */
  rating: number
  /** Codeforces tier name */
  title: string
  /** handle colour (Codeforces official tier colours) */
  color: string
}

// Codeforces official tier colours, keyed by the lower bound of the band.
const UNRATED: HandleStyle = { rating: 0, title: 'Unrated', color: '#000000' }

const HANDLES: Record<string, HandleStyle> = {
  lukewu: { rating: 1723, title: 'Expert', color: '#0000ff' },
  zyo: { rating: 1954, title: 'Candidate Master', color: '#aa00aa' },
  Weeeeeeeeeeeee00: { rating: 1487, title: 'Specialist', color: '#03a89e' },
}

export function handleStyle(name: string): HandleStyle {
  return HANDLES[name] ?? UNRATED
}

/** short cosmetic initials for avatars */
export function handleInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}
