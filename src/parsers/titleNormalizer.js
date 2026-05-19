// Title noise removal as an ordered, tiered rule pipeline.
//
//   Tier 0 — always safe, never deletes real signal.
//   Tier 1 — conservative, default. Known series/part patterns only.
//   Tier 2 — aggressive, fallback only. Strips ambiguous subtitles that
//            sometimes carry real meaning; the resolver only escalates
//            here when a tier-1 query fails to match.
//
// Adding a rule = append one entry to RULES. Each rule is an independently
// testable pure function.

// --- Tier 0 assets ---------------------------------------------------------

// Fold lookalike Unicode punctuation to ASCII so queries stay consistent.
const UNICODE_FOLDS = [
  [/꞉/g, ':'], // U+A789 modifier letter colon
  [/[’‘]/g, "'"],
  [/[“”]/g, '"'],
  [/[–—]/g, '-'],
]

// Edition/format/credit noise inside ( ) or [ ].
// "<anything> edition" catches Deluxe/Anniversary/Special/Movie Tie-in/etc.
const QUALIFIERS = [
  /(?:un)?abridged/,
  /full[- ]cast edition/,
  /dramatized adaptation/,
  /headphones/,
  /narrated by [^\])]+/,
  /read by [^\])]+/,
  /(?:part\s+)?\d+\s+of\s+\d+/,
  /(?:disc|cd|tape)\s*\d+/,
  /[a-z]{2,3}/, // language/region tags: [ENG], (US), [DE]
  /[^\])]+ edition/,
]
const QUALIFIER_RE = new RegExp(
  `\\s*[\\[(]\\s*(?:${QUALIFIERS.map((r) => r.source).join('|')})\\s*[\\])]`,
  'gi'
)

// --- Tier 1 assets ---------------------------------------------------------

const TRAILING_PART_RE = /\s+\d+\s+of\s+\d+\s*$/i

// Trailing series marker with no colon: "Skyward, Book 1", "Vol. 2", "#3",
// word-number ("Book One"), Roman numeral ("Book III").
const NUM_WORD = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|[ivxlc]+)'
const TRAILING_SERIES_RE = new RegExp(
  `[\\s,:-]+(?:(?:book|volume|vol\\.?)\\s*${NUM_WORD}|#\\d+)\\s*$`,
  'i'
)

// Left side of a colon that is a series label, e.g. "Red Rising Saga 2".
const SERIES_LABEL_RE = /^.+\s+\d+$/

// Right side of a colon carrying series info, e.g. "..., Book 2".
const SERIES_SUFFIX_RE = /\bbook\s+\d+/i

// --- Tier 1/2 genre subtitle keywords --------------------------------------

// Subtitles of the form "A <kind>" / "An <kind>" are marketing tags, not
// disambiguating titles. Conservative at tier 1 (only after a colon, only
// when it starts with one of these); broadened use at tier 2.
const GENRE_KEYWORDS = [
  'novel',
  'memoir',
  'thriller',
  'story',
  'mystery',
  'romance',
  'fable',
  'fantasy',
  'sci-fi',
  'science fiction',
  'litrpg',
  'gamelit',
  'graphic novel',
  'audible original',
  'novella',
  'short story',
  'biography',
  'history',
]
const GENRE_SUBTITLE_RE = new RegExp(`^an?\\s+(?:${GENRE_KEYWORDS.join('|')})`, 'i')

// --- Tier 2 assets ---------------------------------------------------------

// Standalone collection words only — NOT bare "Collection", so a real title
// like "Orwell Collection: Animal Farm & 1984" survives.
const COLLECTION_RE =
  /[\s,:-]+(?:omnibus|box(?:ed)?\s+set|the\s+complete\s+series|trilogy|anthology)\s*$/i

const BARE_EDITION_RE =
  /[\s,:-]+(?:special|deluxe|anniversary|collector'?s|extended|revised)\s+edition\s*$/i

// --- Helpers ---------------------------------------------------------------

const stripRepeat = (t, re) => {
  let prev
  do {
    prev = t
    t = t.replace(re, '')
  } while (t !== prev)
  return t
}

const splitColon = (t) => {
  const idx = t.indexOf(':')
  if (idx === -1) return null
  return { left: t.slice(0, idx).trim(), right: t.slice(idx + 1).trim() }
}

const tidy = (t) =>
  t
    .replace(/\s+/g, ' ')
    .replace(/^["']+|["']+$/g, '')
    .replace(/^[\s:,-]+|[\s:,-]+$/g, '')
    .trim()

// --- Rules -----------------------------------------------------------------

export const RULES = [
  {
    name: 'foldUnicode',
    tier: 0,
    apply: (t) => UNICODE_FOLDS.reduce((s, [p, r]) => s.replace(p, r), t),
  },
  {
    name: 'stripBracketNoise',
    tier: 0,
    apply: (t) => stripRepeat(t, QUALIFIER_RE).trim(),
  },
  {
    name: 'resolveColon',
    tier: 1,
    apply: (t) => {
      const c = splitColon(t)
      if (!c) return t
      // "Red Rising Saga 2: Golden Son" → keep the actual title
      if (SERIES_LABEL_RE.test(c.left)) return c.right
      // series info / nested-colon noise / known genre tag → keep left
      if (
        SERIES_SUFFIX_RE.test(c.right) ||
        c.right.includes(':') ||
        GENRE_SUBTITLE_RE.test(c.right)
      ) {
        return c.left
      }
      return t // legitimate subtitle ("The Sandman: Act II")
    },
  },
  {
    name: 'stripTrailingPart',
    tier: 1,
    apply: (t) => t.replace(TRAILING_PART_RE, ''),
  },
  {
    name: 'stripTrailingSeries',
    tier: 1,
    apply: (t) => t.replace(TRAILING_SERIES_RE, ''),
  },
  {
    name: 'stripCollectionMarkers',
    tier: 2,
    apply: (t) => t.replace(COLLECTION_RE, ''),
  },
  {
    name: 'stripBareEdition',
    tier: 2,
    apply: (t) => t.replace(BARE_EDITION_RE, ''),
  },
  {
    name: 'stripGenericSubtitle',
    tier: 2,
    apply: (t) => {
      const c = splitColon(t)
      return c ? c.left : t
    },
  },
]

export function normalizeTitle(title, { maxTier = 1 } = {}) {
  if (!title) return title
  let t = title
  for (const rule of RULES) {
    if (rule.tier <= maxTier) t = rule.apply(t)
  }
  return tidy(t)
}
