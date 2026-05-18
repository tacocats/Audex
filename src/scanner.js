// Scans a directory recursively for audio files with extensions matching SupportedAudioTypes
import { readdir } from 'fs/promises'
import { join, extname } from 'path'
import { SupportedAudioTypes } from './utils/globals.js'
import logger from './logger.js'

export async function scanDirectory(dirPath) {
  const results = []

  async function walk(currentPath) {
    const entries = await readdir(currentPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else {
        logger.debug(`Reading: ${fullPath}`)
        if (SupportedAudioTypes.includes(extname(entry.name).slice(1).toLowerCase())) {
          logger.debug(`Added: ${fullPath}`)
          results.push(fullPath)
        } else {
          logger.debug(`Skipped: ${fullPath}`)
        }
      }
    }
  }

  await walk(dirPath)
  return results
}
