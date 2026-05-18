import logger from '../logger.js'
import { scanDirectory } from '../scanner.js'
import { probeFiles } from '../probe.js'
import { groupByBook } from '../grouper.js'
import { findMetadata } from '../finder.js'

export async function organizeCommand(opts) {
  logger.level = opts.logLevel

  const files = await scanDirectory(opts.input)
  logger.info(`Found ${files.length} audio file(s)`)

  const probed = await probeFiles(files)
  const books = groupByBook(probed)
  logger.info(`Grouped into ${books.length} book(s)`)

  const results = await Promise.all(
    books.map(async (book) => {
      const metadata = await findMetadata(book.title, book.author, opts.provider)
      return { ...book, metadata }
    })
  )

  console.log(results[0])
}
