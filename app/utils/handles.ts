// Codeforces-style handle colouring. Each tracked user is given a fictional
// rating + tier purely for the skin — it doesn't feed any real logic, it just
// drives the coloured handle look. Everyone is a Legendary Grandmaster: the
// whole handle is red, with the first character black (the iconic LGM look).

export interface HandleStyle {
  /** cosmetic rating shown next to the handle */
  rating: number
  /** tier name */
  title: string
  /** handle colour */
  color: string
  /** legendary tier → first character rendered black */
  legendary: boolean
}

const UNRATED: HandleStyle = { rating: 0, title: 'Unrated', color: '#000000', legendary: false }

const LGM = (rating: number): HandleStyle => ({
  rating,
  title: 'Legendary Grandmaster',
  color: '#ff0000',
  legendary: true,
})

const HANDLES: Record<string, HandleStyle> = {
  zyo: LGM(3550),
  lukewu: LGM(3421),
  Weeeeeeeeeeeee00: LGM(3187),
  yc: LGM(3000),
}

export function handleStyle(name: string): HandleStyle {
  return HANDLES[name] ?? UNRATED
}
