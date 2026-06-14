import { jest } from '@jest/globals'

jest.unstable_mockModule('./logger.js', () => ({
  default: { debug: jest.fn(), warn: jest.fn(), info: jest.fn() }
}))

const { groupByBook } = await import('./grouper.js')

const probed = (filePath, tags) => ({ filePath, tags })

describe('groupByBook', () => {
  it('returns an empty array for empty input', () => {
    expect(groupByBook([])).toEqual([])
  })

  it('groups files sharing the same album and author into one book', () => {
    const input = [
      probed('/a/part1.mp3', { album: 'Dune', artist: 'Frank Herbert' }),
      probed('/a/part2.mp3', { album: 'Dune', artist: 'Frank Herbert' })
    ]
    const result = groupByBook(input)
    expect(result).toHaveLength(1)
    expect(result[0].files).toHaveLength(2)
  })

  it('falls back to title tag when album is absent', () => {
    const input = [probed('/a/track.mp3', { title: 'Foundation', artist: 'Isaac Asimov' })]
    const result = groupByBook(input)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Foundation')
  })

  it('prefers album over title when both are present', () => {
    const input = [probed('/a/track.mp3', { album: 'Dune', title: 'Chapter 1', artist: 'Frank Herbert' })]
    const result = groupByBook(input)
    expect(result[0].title).toBe('Dune')
  })

  it('skips files with no album or title', () => {
    const input = [
      probed('/a/good.mp3', { album: 'Dune', artist: 'Frank Herbert' }),
      probed('/a/bad.mp3', { artist: 'Frank Herbert' })
    ]
    const result = groupByBook(input)
    expect(result).toHaveLength(1)
    expect(result[0].files).toEqual(['/a/good.mp3'])
  })

  it('skips files with null tags', () => {
    const input = [
      probed('/a/good.mp3', { album: 'Dune', artist: 'Frank Herbert' }),
      probed('/a/null-tags.mp3', null)
    ]
    const result = groupByBook(input)
    expect(result).toHaveLength(1)
  })

  it('returns an empty array when all files are skipped', () => {
    const input = [probed('/a/track.mp3', {})]
    expect(groupByBook(input)).toEqual([])
  })

  it('splits same title by different authors into separate books', () => {
    const input = [
      probed('/a/track.mp3', { album: 'Hamlet', artist: 'Publisher A' }),
      probed('/b/track.mp3', { album: 'Hamlet', artist: 'Publisher B' })
    ]
    const result = groupByBook(input)
    expect(result).toHaveLength(2)
  })

  it('groups files with no author together under the same title', () => {
    const input = [
      probed('/a/part1.mp3', { album: 'Unknown Book' }),
      probed('/a/part2.mp3', { album: 'Unknown Book' })
    ]
    const result = groupByBook(input)
    expect(result).toHaveLength(1)
    expect(result[0].author).toBeNull()
    expect(result[0].files).toHaveLength(2)
  })

  it('returns the correct shape for each book', () => {
    const input = [probed('/a/track.mp3', { album: 'Dune', artist: 'Frank Herbert' })]
    const [book] = groupByBook(input)
    expect(book).toMatchObject({
      title: 'Dune',
      author: 'Frank Herbert',
      files: ['/a/track.mp3']
    })
  })

  it('resolves author from fallback tag fields (ALBUM, AUTHOR)', () => {
    const input = [probed('/a/track.mp3', { ALBUM: 'Dune', AUTHOR: 'Frank Herbert' })]
    const [book] = groupByBook(input)
    expect(book.title).toBe('Dune')
    expect(book.author).toBe('Frank Herbert')
  })
})
