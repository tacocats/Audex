import { writeFile } from 'fs/promises'
import path from 'path'

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function writeNfo(book, destDir) {
  const m = book.metadata
  const lines = []

  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<root xmlns="NFOStandard" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="NFOStandard https://xsd.nfostandard.com/v2/main.xsd">')
  lines.push('  <media>')
  lines.push('    <audiobook>')

  if (m.title)         lines.push(`      <title>${escapeXml(m.title)}</title>`)
  if (m.publishedYear) lines.push(`      <releaseDate>${escapeXml(m.publishedYear)}-01-01</releaseDate>`)
  if (m.publisher)     lines.push(`      <productionCompany>${escapeXml(m.publisher)}</productionCompany>`)
  if (m.isbn)          lines.push(`      <isbn>${escapeXml(m.isbn)}</isbn>`)
  if (m.duration != null) lines.push(`      <duration>${Math.round(m.duration * 60)}</duration>`)
  if (m.language)      lines.push(`      <language>${escapeXml(m.language)}</language>`)

  for (const genre of m.genres ?? []) {
    lines.push(`      <genre>${escapeXml(genre)}</genre>`)
  }

  if (m.author) {
    lines.push('      <writer>')
    lines.push(`        <name>${escapeXml(m.author)}</name>`)
    lines.push('      </writer>')
  }

  if (m.narrator) {
    for (const name of m.narrator.split(', ')) {
      lines.push('      <voiceActor>')
      lines.push(`        <name>${escapeXml(name.trim())}</name>`)
      lines.push('        <role>Narrator</role>')
      lines.push('      </voiceActor>')
    }
  }

  for (const tag of m.tags ?? []) {
    lines.push(`      <tag>${escapeXml(tag)}</tag>`)
  }

  if (m.description) lines.push(`      <description>${escapeXml(m.description)}</description>`)

  if (m.rating != null) {
    lines.push(`      <rating name="audible" value="${escapeXml(String(m.rating))}" max="5"/>`)
  }

  if (m.isbn) lines.push(`      <uniqueId type="isbn">${escapeXml(m.isbn)}</uniqueId>`)
  if (m.asin) lines.push(`      <uniqueId type="asin">${escapeXml(m.asin)}</uniqueId>`)

  if (m.cover) lines.push(`      <cover type="poster" url="${escapeXml(m.cover)}">Cover Image</cover>`)

  lines.push('    </audiobook>')
  lines.push('  </media>')
  lines.push('</root>')

  await writeFile(path.join(destDir, 'audiobook.nfo'), lines.join('\n') + '\n')
}
