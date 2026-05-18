// Groups probed audio files into books by matching on shared album and author tags
import { extractAlbum, extractTitle, extractAuthor } from './utils/tags.js'

export function groupByBook(probed) {
  const books = new Map()
  let skipped = 0

  for (const { filePath, tags } of probed) {
    const t = tags ?? {}
    const bookTitle = extractAlbum(t) ?? extractTitle(t)
    const author = extractAuthor(t)

    if (!bookTitle) {
      console.log(`[grouper] skipped (no title/album): ${filePath}`)
      skipped++
      continue
    }

    const key = `${bookTitle}::${author ?? ''}`

    if (!books.has(key)) {
      books.set(key, { title: bookTitle, author, files: [] })
    }

    books.get(key).files.push(filePath)
  }

  console.log(`[grouper] skipped ${skipped} file(s) with no title or album`)
  for (const [key, book] of books) {
    console.log(`[grouper] "${key}" → ${book.files.length} file(s)`)
  }

  return Array.from(books.values())
}
