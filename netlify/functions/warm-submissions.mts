import { runWarmHandler } from '../../server/utils/warm'

/** The expensive one: every problem in the week times every tracked user. TTL
 *  is 6 hours, so 20 minutes leaves a wide margin against ever expiring. */
export default async () => runWarmHandler('submissions')

export const config = { schedule: '*/20 * * * *' }
