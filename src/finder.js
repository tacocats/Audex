// Searches external metadata providers (Audible, GoogleBooks, iTunes) to match audiobooks
import pThrottle from 'p-throttle'
import logger from './logger.js'
import Audible from './providers/Audible.js'
import GoogleBooks from './providers/GoogleBooks.js'
import iTunes from './providers/iTunes.js'

const providers = {
  Audible: new Audible(),
  GoogleBooks: new GoogleBooks(),
  iTunes: new iTunes()
}

const MAX_CANDIDATES = 10

const throttle = pThrottle({ limit: 2, interval: 1000 })

// Returns up to MAX_CANDIDATES ranked-by-provider results so the resolver can
// score them, instead of blindly trusting the first hit.
export const searchMetadata = throttle(async (title, author, providerName) => {
  if (!title) {
    logger.debug(`[Finder] Skipping search — no title extracted`)
    return []
  }

  const provider = providers[providerName]
  if (!provider) {
    logger.debug(`[Finder] Unknown provider: ${providerName}`)
    return []
  }

  logger.debug(`[Finder] Searching ${providerName} for "${title}" by "${author}"`)

  let results = []
  if (providerName === 'Audible') {
    results = await provider.search(title, author, null, null)
  } else if (providerName === 'GoogleBooks') {
    results = await provider.search(title, author)
  } else if (providerName === 'iTunes') {
    results = await provider.searchAudiobooks([title, author].filter(Boolean).join(' '))
  }

  return (results ?? []).slice(0, MAX_CANDIDATES)
})

export async function findMetadata(title, author, providerName) {
  const results = await searchMetadata(title, author, providerName)
  return results[0] ?? null
}
