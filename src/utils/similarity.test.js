import { titleSimilarity, scoreCandidate } from './similarity.js'

describe('titleSimilarity', () => {
  it('is 1 for identical titles (case/punct insensitive)', () => {
    expect(titleSimilarity('The Martian', 'the martian!')).toBe(1)
  })

  it('is 0 when either side is empty', () => {
    expect(titleSimilarity('', 'x')).toBe(0)
    expect(titleSimilarity('x', null)).toBe(0)
  })

  it('scores a near-miss high', () => {
    expect(titleSimilarity('Project Hail Mary', 'Project Hail Mary: A Novel')).toBeGreaterThan(0.6)
  })

  it('scores an unrelated title low', () => {
    expect(titleSimilarity('The Martian', 'Pride and Prejudice')).toBeLessThan(0.2)
  })

  it('tolerates token reordering via the Jaccard floor', () => {
    expect(titleSimilarity('Golden Son Red Rising', 'Red Rising Golden Son')).toBeGreaterThan(0.6)
  })
})

describe('scoreCandidate', () => {
  it('falls back to title score when author is missing', () => {
    const s = scoreCandidate('The Martian', null, { title: 'The Martian', author: null })
    expect(s).toBe(1)
  })

  it('author agreement lifts a borderline title match', () => {
    const withAuthor = scoreCandidate('Golden Son', 'Pierce Brown', {
      title: 'Golden Son: Book II',
      author: 'Pierce Brown'
    })
    const withoutAuthor = scoreCandidate('Golden Son', null, {
      title: 'Golden Son: Book II',
      author: 'Pierce Brown'
    })
    expect(withAuthor).toBeGreaterThan(withoutAuthor)
  })

  it('wrong author drags the score down', () => {
    const right = scoreCandidate('Artemis', 'Andy Weir', {
      title: 'Artemis',
      author: 'Andy Weir'
    })
    const wrong = scoreCandidate('Artemis', 'Andy Weir', {
      title: 'Artemis',
      author: 'Someone Else'
    })
    expect(wrong).toBeLessThan(right)
  })
})
