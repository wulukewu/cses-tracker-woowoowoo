import { runWarmHandler } from '../../server/utils/warm'

/** Cheapest of the three — one page per tracked user — and the one that drives
 *  the solved ticks, so it runs the most often. TTL is 10 minutes. */
export default async () => runWarmHandler('progress')

export const config = { schedule: '*/5 * * * *' }
