import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { scanDirectory } from '../../src/scanner.js'

let dir

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'audex-scanner-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true })
})

describe('scanDirectory', () => {
  it('returns an empty array for an empty directory', async () => {
    expect(await scanDirectory(dir)).toEqual([])
  })

  it('returns audio files and ignores non-audio files', async () => {
    await writeFile(join(dir, 'track.mp3'), '')
    await writeFile(join(dir, 'track.m4b'), '')
    await writeFile(join(dir, 'cover.jpg'), '')
    await writeFile(join(dir, 'notes.txt'), '')

    const result = await scanDirectory(dir)
    expect(result).toHaveLength(2)
    expect(result.some((f) => f.endsWith('track.mp3'))).toBe(true)
    expect(result.some((f) => f.endsWith('track.m4b'))).toBe(true)
  })

  it('recurses into subdirectories', async () => {
    const sub = join(dir, 'Author', 'Book')
    await mkdir(sub, { recursive: true })
    await writeFile(join(sub, 'chapter1.flac'), '')
    await writeFile(join(sub, 'chapter2.flac'), '')

    const result = await scanDirectory(dir)
    expect(result).toHaveLength(2)
  })

  it('returns absolute paths', async () => {
    await writeFile(join(dir, 'track.mp3'), '')
    const [filePath] = await scanDirectory(dir)
    expect(filePath).toBe(join(dir, 'track.mp3'))
  })

  it('handles multiple supported formats', async () => {
    const formats = ['mp3', 'm4b', 'm4a', 'flac', 'opus', 'ogg', 'aac']
    await Promise.all(formats.map((ext) => writeFile(join(dir, `track.${ext}`), '')))

    const result = await scanDirectory(dir)
    expect(result).toHaveLength(formats.length)
  })

  it('is case-insensitive for extensions', async () => {
    await writeFile(join(dir, 'track.MP3'), '')
    await writeFile(join(dir, 'track.M4B'), '')

    const result = await scanDirectory(dir)
    expect(result).toHaveLength(2)
  })
})
