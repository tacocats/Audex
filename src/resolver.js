// Progressive retry cascade: normalize conservatively, query, and only
// escalate to more aggressive normalization when the result is weak.
// Aggressive stripping can never poison a title that matches clean because
// it only ever runs as a fallback.
import logger from './logger.js'
import { searchMetadata } from './finder.js'
import { normalizeTitle } from './parsers/titleNormalizer.js'
import { scoreCandidate } from './utils/similarity.js'

const ACCEPT_THRESHOLD = 0.8
const MIN_THRESHOLD = 0.55
const TIERS = [1, 2]

export async function resolveMetadata(rawTitle, author, providerName) {
  let best = null
  let bestScore = 0
  let bestTier = null

  for (const tier of TIERS) {
    const query = normalizeTitle(rawTitle, { maxTier: tier })
    const candidates = await searchMetadata(query, author, providerName)

    for (const candidate of candidates) {
      const score = scoreCandidate(query, author, candidate)
      if (score > bestScore) {
        best = candidate
        bestScore = score
        bestTier = tier
      }
    }

    if (bestScore >= ACCEPT_THRESHOLD) break
  }

  if (bestScore < MIN_THRESHOLD) {
    logger.debug(
      `[Resolver] No confident match for "${rawTitle}" (best ${bestScore.toFixed(2)})`
    )
    return null
  }

  logger.debug(
    `[Resolver] Matched "${rawTitle}" → "${best.title}" (tier ${bestTier}, score ${bestScore.toFixed(2)})`
  )
  return best
}
