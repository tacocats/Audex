import { mkdir, rename, unlink } from 'fs/promises'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import logger from './logger.js'

// eslint-disable-next-line no-control-regex
const INVALID_PATH_CHARS = /[<>:"/\\|?*\x00]/g

function sanitize(str) {
  return str.replace(INVALID_PATH_CHARS, '').replace(/\s+/g, ' ').trim() || 'Unknown'
}

export async function moveBook(book, outputDir) {
  const author = sanitize(book.metadata.author ?? 'Unknown Author')
  const title = sanitize(book.metadata.title)
  const destDir = path.join(outputDir, author, title)

  await mkdir(destDir, { recursive: true })

  for (const src of book.files) {
    const dest = path.join(destDir, path.basename(src))
    try {
      await rename(src, dest)
    } catch (err) {
      if (err.code !== 'EXDEV') throw err
      await pipeline(createReadStream(src), createWriteStream(dest))
      await unlink(src)
    }
    logger.info(`Moved ${path.basename(src)} → ${destDir}`)
  }

  return destDir
}
