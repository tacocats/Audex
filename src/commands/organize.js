import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import logger from '../logger.js'
import { scanDirectory } from '../scanner.js'
import { probeFiles } from '../probe.js'
import { groupByBook } from '../grouper.js'
import { resolveMetadata } from '../resolver.js'
import { moveBook } from '../mover.js'
import { writeNfo } from '../nfo.js'

export async function organizeCommand(opts) {
  logger.level = opts.logLevel

  const files = await scanDirectory(opts.input)
  logger.info(`Found ${files.length} audio file(s)`)

  const probed = await probeFiles(files)
  const books = groupByBook(probed)
  logger.info(`Grouped into ${books.length} book(s)`)

  const results = await Promise.all(
    books.map(async (book) => {
      const metadata = await resolveMetadata(book.title, book.author, opts.provider)
      return { ...book, metadata }
    })
  )

  const matched = results.filter((r) => r.metadata !== null)
  const skipped = results.filter((r) => r.metadata === null)

  await mkdir(opts.output, { recursive: true })

  for (const book of matched) {
    const destDir = await moveBook(book, opts.output)
    await writeNfo(book, destDir)
  }

  logger.info(`Organized ${matched.length} book(s)`)

  if (skipped.length > 0) {
    logger.warn(`${skipped.length} book(s) skipped — no confident metadata match`)
    const skipData = skipped.map((b) => ({ title: b.title, author: b.author, files: b.files }))
    await writeFile(path.join(opts.output, 'skipped.json'), JSON.stringify(skipData, null, 2))
    logger.info('Skipped book list written to skipped.json in output directory')
  }
}
