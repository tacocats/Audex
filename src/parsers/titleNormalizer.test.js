import { normalizeTitle, RULES } from './titleNormalizer.js'

// Look up a single rule's pure transform for isolated unit testing.
const rule = (name) => RULES.find((r) => r.name === name).apply

describe('normalizeTitle', () => {
  describe('falsy / no-op input', () => {
    it.each([
      ['', ''],
      [null, null],
      [undefined, undefined],
    ])('returns %p unchanged', (input, expected) => {
      expect(normalizeTitle(input)).toBe(expected)
    })

    it('leaves a clean title untouched', () => {
      expect(normalizeTitle('Project Hail Mary')).toBe('Project Hail Mary')
    })
  })

  // --- Per-rule unit tests -------------------------------------------------

  describe('rule: foldUnicode (tier 0)', () => {
    const foldUnicode = rule('foldUnicode')
    it.each([
      ['Harry Potter꞉ X', 'Harry Potter: X'],
      ['Sorcerer’s', "Sorcerer's"],
      ['‘a’ “b”', "'a' \"b\""],
      ['x – y — z', 'x - y - z'],
    ])('folds %p', (input, expected) => {
      expect(foldUnicode(input)).toBe(expected)
    })
  })

  describe('rule: stripBracketNoise (tier 0)', () => {
    const stripBracketNoise = rule('stripBracketNoise')
    it.each([
      ['Baptism of Fire (Unabridged)', 'Baptism of Fire'],
      ['The Final Empire (Abridged)', 'The Final Empire'],
      ['Order of the Phoenix (Full-Cast Edition)', 'Order of the Phoenix'],
      ['Goblet of Fire [Headphones]', 'Goblet of Fire'],
      ['Golden Son (Dramatized Adaptation)', 'Golden Son'],
      ['Some Book (Deluxe Edition)', 'Some Book'],
      ['Way of Kings [Narrated by Michael Kramer]', 'Way of Kings'],
      ['Title [Read by Someone]', 'Title'],
      ['Golden Son (Part 1 of 2)', 'Golden Son'],
      ['Iron Gold (1 of 2)', 'Iron Gold'],
      ['The Hobbit (Disc 2)', 'The Hobbit'],
      ['The Hobbit [CD1]', 'The Hobbit'],
      ['Some Title (US)', 'Some Title'],
      ['Some Title [ENG]', 'Some Title'],
    ])('strips noise from %p', (input, expected) => {
      expect(stripBracketNoise(input).trim()).toBe(expected)
    })

    it('strips multiple stacked qualifiers', () => {
      expect(
        stripBracketNoise('Half-Blood Prince (Full-Cast Edition) (Unabridged)').trim()
      ).toBe('Half-Blood Prince')
    })
  })

  describe('rule: resolveColon (tier 1)', () => {
    const resolveColon = rule('resolveColon')
    it.each([
      ['Red Rising Saga 2: Golden Son', 'Golden Son'],
      ["Carl's Doomsday Scenario: Dungeon Crawler Carl, Book 2", "Carl's Doomsday Scenario"],
      ['Infinity Gate: Pandominion, Book 1', 'Infinity Gate'],
      ['Dungeon Crawler Carl: A LitRPG/Gamelit Adventure', 'Dungeon Crawler Carl'],
      ['World War Z: The Complete Edition: An Oral History', 'World War Z'],
      ['The Sandman: Act II', 'The Sandman: Act II'],
      ['Orwell Collection: Animal Farm & 1984', 'Orwell Collection: Animal Farm & 1984'],
    ])('%p → %p', (input, expected) => {
      expect(resolveColon(input)).toBe(expected)
    })
  })

  describe('rule: stripTrailingSeries (tier 1)', () => {
    const stripTrailingSeries = rule('stripTrailingSeries')
    it.each([
      ['Skyward, Book 1', 'Skyward'],
      ['Mistborn Vol. 2', 'Mistborn'],
      ['Mistborn Volume 3', 'Mistborn'],
      ['The Wheel of Time #3', 'The Wheel of Time'],
      ['Some Series Book One', 'Some Series'],
      ['Some Series Book III', 'Some Series'],
    ])('%p → %p', (input, expected) => {
      expect(stripTrailingSeries(input)).toBe(expected)
    })
  })

  describe('rule: stripCollectionMarkers (tier 2)', () => {
    const stripCollectionMarkers = rule('stripCollectionMarkers')
    it.each([
      ['The Stormlight Archive Omnibus', 'The Stormlight Archive'],
      ['Foundation Boxed Set', 'Foundation'],
      ['Dune: The Complete Series', 'Dune'],
      ['The Lord of the Rings Trilogy', 'The Lord of the Rings'],
    ])('%p → %p', (input, expected) => {
      expect(stripCollectionMarkers(input)).toBe(expected)
    })

    it('does not strip a bare "Collection" in a real title', () => {
      expect(stripCollectionMarkers('Orwell Collection: Animal Farm & 1984')).toBe(
        'Orwell Collection: Animal Farm & 1984'
      )
    })
  })

  describe('rule: stripBareEdition (tier 2)', () => {
    const stripBareEdition = rule('stripBareEdition')
    it.each([
      ['The Stand Special Edition', 'The Stand'],
      ['It Deluxe Edition', 'It'],
      ['Dune Collector’s Edition'.replace('’', "'"), 'Dune'],
    ])('%p → %p', (input, expected) => {
      expect(stripBareEdition(input)).toBe(expected)
    })
  })

  // --- Tier behavior -------------------------------------------------------

  describe('tier gating', () => {
    it('tier 0 only: folds + bracket strip, keeps subtitle', () => {
      expect(normalizeTitle('The Sandman꞉ Act II (Unabridged)', { maxTier: 0 })).toBe(
        'The Sandman: Act II'
      )
    })

    it('tier 1 (default): conservative colon/series handling', () => {
      expect(normalizeTitle('Red Rising Saga 2: Golden Son 2 of 2')).toBe('Golden Son')
      // ambiguous subtitle preserved at default tier
      expect(normalizeTitle('The Quiet American: A Reckoning')).toBe(
        'The Quiet American: A Reckoning'
      )
    })

    it('tier 2: aggressively drops any remaining subtitle', () => {
      expect(
        normalizeTitle('The Quiet American: A Reckoning', { maxTier: 2 })
      ).toBe('The Quiet American')
    })

    it('tier 2 strips collection markers tier 1 leaves alone', () => {
      expect(normalizeTitle('Foundation Boxed Set')).toBe('Foundation Boxed Set')
      expect(normalizeTitle('Foundation Boxed Set', { maxTier: 2 })).toBe('Foundation')
    })
  })

  describe('whitespace / quote hygiene', () => {
    it('collapses internal whitespace', () => {
      expect(normalizeTitle('The   Martian')).toBe('The Martian')
    })
    it('trims separators left dangling by a strip', () => {
      expect(normalizeTitle('The Martian - (Unabridged)')).toBe('The Martian')
    })
    it('strips wrapping quotes', () => {
      expect(normalizeTitle('"The Martian"')).toBe('The Martian')
    })
  })

  // --- Regression guard over the real scraped library ----------------------

  describe('library snapshot (default tier)', () => {
    it.each([
      ["The Hitchhiker's Guide To The Galaxy", "The Hitchhiker's Guide To The Galaxy"],
      ['Harry Potter꞉ The Goblet of Fire [Headphones]', 'Harry Potter: The Goblet of Fire'],
      ['Harry Potter and the Order of the Phoenix (Full-Cast Edition)', 'Harry Potter and the Order of the Phoenix'],
      ['Dungeon Crawler Carl: A LitRPG/Gamelit Adventure', 'Dungeon Crawler Carl'],
      ["Carl's Doomsday Scenario: Dungeon Crawler Carl, Book 2", "Carl's Doomsday Scenario"],
      ["The Dungeon Anarchist's Cookbook: Dungeon Crawler Carl, Book 3", "The Dungeon Anarchist's Cookbook"],
      ['The Gate of the Feral Gods: Dungeon Crawler Carl, Book 4', 'The Gate of the Feral Gods'],
      ['After The Fall (Unabridged)', 'After The Fall'],
      ['Orwell Collection: Animal Farm & 1984', 'Orwell Collection: Animal Farm & 1984'],
      ['Infinity Gate: Pandominion, Book 1', 'Infinity Gate'],
      ['Golden Son (Part 1 of 2) (Dramatized Adaptation)', 'Golden Son'],
      ['Red Rising Saga 2: Golden Son 2 of 2', 'Golden Son'],
      ['Iron Gold (1 of 2) [Dramatized Adaptation]', 'Iron Gold'],
      ['Red Rising Saga 4: Iron Gold 2 of 2', 'Iron Gold'],
      ['Morning Star (Part 1 of 2) (Dramatized Adaptation)', 'Morning Star'],
      ['Red Rising Saga 3: Morning Star 2 of 2', 'Morning Star'],
      ['The Sandman: Act II', 'The Sandman: Act II'],
      ['Baptism of Fire (Unabridged)', 'Baptism of Fire'],
      ['World War Z: The Complete Edition (Movie Tie-in Edition): An Oral History of the Zombie War', 'World War Z'],
      ['There Is No Antimemetics Division', 'There Is No Antimemetics Division'],
      ['Harry Potter and the Sorcerer’s Stone (Full-Cast Edition)', "Harry Potter and the Sorcerer's Stone"],
    ])('%p → %p', (input, expected) => {
      expect(normalizeTitle(input)).toBe(expected)
    })
  })
})
