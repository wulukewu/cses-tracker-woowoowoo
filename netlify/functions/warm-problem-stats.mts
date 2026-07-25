import { runWarmHandler } from '../../server/utils/warm'

/** Site-wide solve counts barely move, so a 24-hour TTL refreshed twice a day
 *  keeps the usual two-to-one margin without scraping more than it needs to. */
export default async () => runWarmHandler('problem-stats')

export const config = { schedule: '0 */12 * * *' }
