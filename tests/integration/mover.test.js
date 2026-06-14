import { mkdtemp, rm, writeFile, access } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { moveBook } from '../../src/mover.js'

let srcDir, outDir

const book = (overrides = {}) => ({
  metadata: { title: 'Dune', author: 'Frank Herbert', ...overrides },
  files: []
})

beforeEach(async () => {
  ;[srcDir, outDir] = await Promise.all([
    mkdtemp(join(tmpdir(), 'audex-src-')),
    mkdtemp(join(tmpdir(), 'audex-out-'))
  ])
})

afterEach(async () => {
  await Promise.all([rm(srcDir, { recursive: true }), rm(outDir, { recursive: true })])
})

async function exists(path) {
  return access(path).then(() => true).catch(() => false)
}

describe('moveBook', () => {
  it('creates the Author/Title directory structure in the output dir', async () => {
    const b = book()
    await moveBook(b, outDir)
    expect(await exists(join(outDir, 'Frank Herbert', 'Dune'))).toBe(true)
  })

  it('moves files into the destination directory', async () => {
    const file = join(srcDir, 'chapter1.mp3')
    await writeFile(file, '')
    const b = { ...book(), files: [file] }

    await moveBook(b, outDir)

    expect(await exists(file)).toBe(false)
    expect(await exists(join(outDir, 'Frank Herbert', 'Dune', 'chapter1.mp3'))).toBe(true)
  })

  it('moves multiple files', async () => {
    const files = ['part1.mp3', 'part2.mp3', 'part3.mp3'].map((f) => join(srcDir, f))
    await Promise.all(files.map((f) => writeFile(f, '')))
    const b = { ...book(), files }

    await moveBook(b, outDir)

    for (const f of files) {
      const name = f.split('/').pop()
      expect(await exists(join(outDir, 'Frank Herbert', 'Dune', name))).toBe(true)
    }
  })

  it('returns the destination directory path', async () => {
    const b = book()
    const dest = await moveBook(b, outDir)
    expect(dest).toBe(join(outDir, 'Frank Herbert', 'Dune'))
  })

  it('sanitizes invalid path characters from author and title', async () => {
    const b = book({ author: 'Author: "Name"', title: 'Title <One>' })
    await moveBook(b, outDir)
    expect(await exists(join(outDir, 'Author Name', 'Title One'))).toBe(true)
  })

  it('falls back to "Unknown Author" when author is missing', async () => {
    const b = book({ author: null })
    await moveBook(b, outDir)
    expect(await exists(join(outDir, 'Unknown Author', 'Dune'))).toBe(true)
  })

  it('falls back to "Unknown" when title sanitizes to empty', async () => {
    const b = book({ title: '<>:"/\\|?*' })
    await moveBook(b, outDir)
    expect(await exists(join(outDir, 'Frank Herbert', 'Unknown'))).toBe(true)
  })
})
