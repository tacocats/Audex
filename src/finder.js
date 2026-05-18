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

const throttle = pThrottle({ limit: 2, interval: 1000 })

export const findMetadata = throttle(async (title, author, providerName) => {
  if (!title) {
    logger.debug(`[Finder] Skipping search — no title extracted`)
    return null
  }

  const provider = providers[providerName]
  if (!provider) {
    logger.debug(`[Finder] Unknown provider: ${providerName}`)
    return null
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

  return results[0] ?? null
})
