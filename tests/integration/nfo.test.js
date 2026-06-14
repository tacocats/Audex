import { mkdtemp, rm, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { XMLParser } from 'fast-xml-parser'
import { writeNfo } from '../../src/nfo.js'

let dir
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false })

const baseBook = {
  metadata: {
    title: 'Dune',
    author: 'Frank Herbert',
    narrator: 'Scott Brick',
    publishedYear: '1965',
    publisher: 'Macmillan Audio',
    isbn: '9781250748577',
    asin: 'B002V5HKBE',
    duration: 21.5,
    language: 'English',
    genres: ['Science Fiction', 'Fantasy'],
    tags: ['Classic', 'Hugo Award'],
    description: 'A desert planet.',
    rating: 4.8,
    cover: 'https://example.com/cover.jpg'
  }
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'audex-nfo-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true })
})

async function parseNfo() {
  const xml = await readFile(join(dir, 'audiobook.nfo'), 'utf8')
  return parser.parse(xml)
}

describe('writeNfo', () => {
  it('writes audiobook.nfo to the destination directory', async () => {
    await writeNfo(baseBook, dir)
    const xml = await readFile(join(dir, 'audiobook.nfo'), 'utf8')
    expect(xml).toBeTruthy()
  })

  it('produces valid XML with the NFOStandard root element', async () => {
    await writeNfo(baseBook, dir)
    const parsed = await parseNfo()
    expect(parsed.root).toBeDefined()
    expect(parsed.root.media.audiobook).toBeDefined()
  })

  it('writes all core metadata fields correctly', async () => {
    await writeNfo(baseBook, dir)
    const { audiobook } = (await parseNfo()).root.media
    expect(audiobook.title).toBe('Dune')
    expect(audiobook.releaseDate).toBe('1965-01-01')
    expect(audiobook.productionCompany).toBe('Macmillan Audio')
    expect(audiobook.isbn).toBe('9781250748577')
    expect(audiobook.language).toBe('English')
    expect(audiobook.description).toBe('A desert planet.')
  })

  it('converts duration from minutes to seconds', async () => {
    await writeNfo(baseBook, dir)
    const { audiobook } = (await parseNfo()).root.media
    expect(Number(audiobook.duration)).toBe(Math.round(21.5 * 60))
  })

  it('writes genres and tags', async () => {
    await writeNfo(baseBook, dir)
    const { audiobook } = (await parseNfo()).root.media
    const genres = [].concat(audiobook.genre)
    expect(genres).toContain('Science Fiction')
    expect(genres).toContain('Fantasy')
    const tags = [].concat(audiobook.tag)
    expect(tags).toContain('Classic')
  })

  it('splits multiple narrators into separate voiceActor elements', async () => {
    const book = { metadata: { ...baseBook.metadata, narrator: 'John Smith, Jane Doe' } }
    await writeNfo(book, dir)
    const { audiobook } = (await parseNfo()).root.media
    const actors = [].concat(audiobook.voiceActor)
    expect(actors).toHaveLength(2)
    expect(actors.map((a) => a.name)).toContain('John Smith')
    expect(actors.map((a) => a.name)).toContain('Jane Doe')
  })

  it('writes ASIN and ISBN as uniqueId elements', async () => {
    await writeNfo(baseBook, dir)
    const { audiobook } = (await parseNfo()).root.media
    const ids = [].concat(audiobook.uniqueId)
    expect(ids.some((id) => id['@_type'] === 'asin')).toBe(true)
    expect(ids.some((id) => id['@_type'] === 'isbn')).toBe(true)
  })

  it('escapes XML special characters in title and description', async () => {
    const book = {
      metadata: { ...baseBook.metadata, title: 'AT&T: "The <Story>"', description: "Jack's tale" }
    }
    await writeNfo(book, dir)
    const xml = await readFile(join(dir, 'audiobook.nfo'), 'utf8')
    expect(xml).toContain('AT&amp;T')
    expect(xml).toContain('&lt;Story&gt;')
    expect(xml).toContain('&quot;')
    expect(xml).toContain('Jack&apos;s tale')
  })

  it('omits optional fields when they are null', async () => {
    const book = { metadata: { title: 'Minimal Book' } }
    await writeNfo(book, dir)
    const xml = await readFile(join(dir, 'audiobook.nfo'), 'utf8')
    expect(xml).not.toContain('<releaseDate>')
    expect(xml).not.toContain('<description>')
    expect(xml).not.toContain('<writer>')
    expect(xml).not.toContain('<rating')
  })
})
