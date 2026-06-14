import { jest } from '@jest/globals'

const mockGet = jest.fn()
jest.unstable_mockModule('axios', () => ({ default: { get: mockGet } }))
jest.unstable_mockModule('../../../src/logger.js', () => ({
  default: { debug: jest.fn(), warn: jest.fn(), info: jest.fn(), error: jest.fn() }
}))

const { default: Audible } = await import('../../../src/providers/Audible.js')

const audible = new Audible()

const asinResponse = (overrides = {}) => ({
  data: {
    asin: 'B002V5HKBE',
    title: 'Dune',
    subtitle: null,
    authors: [{ name: 'Frank Herbert' }],
    narrators: [{ name: 'Scott Brick' }],
    publisherName: 'Macmillan Audio',
    summary: 'A desert planet.',
    releaseDate: '2007-08-07',
    image: 'https://example.com/cover.jpg',
    genres: [
      { type: 'genre', name: 'Science Fiction' },
      { type: 'genre', name: 'Fantasy' },
      { type: 'tag', name: 'Hugo Award' }
    ],
    seriesPrimary: { name: 'Dune Chronicles', position: '1' },
    seriesSecondary: null,
    language: 'english',
    runtimeLengthMin: 1290,
    formatType: 'unabridged',
    isbn: '9781250748577',
    ...overrides
  }
})

const catalogResponse = (asins) => ({
  data: { products: asins.map((asin) => ({ asin })) }
})

describe('Audible.cleanSeriesSequence', () => {
  it('returns the numeric part of a sequence string', () => {
    expect(audible.cleanSeriesSequence('Dune', '1')).toBe('1')
    expect(audible.cleanSeriesSequence('Dune', 'Book 1')).toBe('1')
    expect(audible.cleanSeriesSequence('Dune', '2, Dramatized Adaptation')).toBe('2')
    expect(audible.cleanSeriesSequence('Dune', '1.5')).toBe('1.5')
  })

  it('returns the original string when no number is found', () => {
    expect(audible.cleanSeriesSequence('Dune', 'Prologue')).toBe('Prologue')
  })

  it('returns empty string when sequence is falsy', () => {
    expect(audible.cleanSeriesSequence('Dune', null)).toBe('')
    expect(audible.cleanSeriesSequence('Dune', '')).toBe('')
  })
})

describe('Audible.cleanResult', () => {
  it('maps API fields to the expected output shape', () => {
    const result = audible.cleanResult(asinResponse().data)
    expect(result).toMatchObject({
      title: 'Dune',
      author: 'Frank Herbert',
      narrator: 'Scott Brick',
      publisher: 'Macmillan Audio',
      publishedYear: '2007',
      asin: 'B002V5HKBE',
      isbn: '9781250748577',
      duration: 1290,
      abridged: false
    })
  })

  it('joins multiple authors with a comma', () => {
    const result = audible.cleanResult({
      ...asinResponse().data,
      authors: [{ name: 'Author A' }, { name: 'Author B' }]
    })
    expect(result.author).toBe('Author A, Author B')
  })

  it('joins multiple narrators with a comma', () => {
    const result = audible.cleanResult({
      ...asinResponse().data,
      narrators: [{ name: 'Narrator A' }, { name: 'Narrator B' }]
    })
    expect(result.narrator).toBe('Narrator A, Narrator B')
  })

  it('separates genres from tags', () => {
    const result = audible.cleanResult(asinResponse().data)
    expect(result.genres).toContain('Science Fiction')
    expect(result.genres).not.toContain('Hugo Award')
    expect(result.tags).toContain('Hugo Award')
    expect(result.tags).not.toContain('Science Fiction')
  })

  it('deduplicates genres and tags', () => {
    const result = audible.cleanResult({
      ...asinResponse().data,
      genres: [
        { type: 'genre', name: 'Science Fiction' },
        { type: 'genre', name: 'Science Fiction' },
        { type: 'tag', name: 'Classic' },
        { type: 'tag', name: 'Classic' }
      ]
    })
    expect(result.genres).toHaveLength(1)
    expect(result.tags).toHaveLength(1)
  })

  it('capitalises the language field', () => {
    const result = audible.cleanResult(asinResponse().data)
    expect(result.language).toBe('English')
  })

  it('marks abridged correctly', () => {
    const result = audible.cleanResult({ ...asinResponse().data, formatType: 'abridged' })
    expect(result.abridged).toBe(true)
  })

  it('sets genres to null when the array is empty', () => {
    const result = audible.cleanResult({ ...asinResponse().data, genres: [] })
    expect(result.genres).toBeNull()
    expect(result.tags).toBeNull()
  })
})

describe('Audible.search', () => {
  beforeEach(() => mockGet.mockReset())

  it('returns cleaned results from a keyword search', async () => {
    mockGet
      .mockResolvedValueOnce(catalogResponse(['B002V5HKBE']))
      .mockResolvedValueOnce(asinResponse())

    const results = await audible.search('Dune', 'Frank Herbert')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Dune')
  })

  it('returns an empty array when the API returns no products', async () => {
    mockGet.mockResolvedValueOnce({ data: { products: [] } })
    const results = await audible.search('Unknown Book Nobody Wrote', null)
    expect(results).toEqual([])
  })

  it('returns an empty array on network error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))
    const results = await audible.search('Dune', 'Frank Herbert')
    expect(results).toEqual([])
  })
})
