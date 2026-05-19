// Dependency-free fuzzy matching for ranking provider search candidates.
// Providers return no confidence score, so the resolver derives one here.

const tokenize = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

// Sørensen–Dice over token bigrams, with a token-set Jaccard floor so that
// reordered or partial titles still score reasonably. Returns 0..1.
export function titleSimilarity(a, b) {
  const ta = tokenize(a)
  const tb = tokenize(b)
  if (ta.length === 0 || tb.length === 0) return 0

  const setA = new Set(ta)
  const setB = new Set(tb)
  let inter = 0
  for (const t of setA) if (setB.has(t)) inter++
  const jaccard = inter / (setA.size + setB.size - inter)

  const bigrams = (toks) => {
    if (toks.length === 1) return [toks[0]]
    const out = []
    for (let i = 0; i < toks.length - 1; i++) out.push(toks[i] + ' ' + toks[i + 1])
    return out
  }
  const ba = bigrams(ta)
  const bb = bigrams(tb)
  const bbCount = new Map()
  for (const g of bb) bbCount.set(g, (bbCount.get(g) ?? 0) + 1)
  let dice = 0
  for (const g of ba) {
    const c = bbCount.get(g)
    if (c > 0) {
      dice++
      bbCount.set(g, c - 1)
    }
  }
  const diceScore = (2 * dice) / (ba.length + bb.length)

  return Math.max(diceScore, jaccard)
}

// Blends title similarity with an author-match bonus. Author agreement is
// strong evidence, so it can lift an otherwise borderline title match.
export function scoreCandidate(queryTitle, queryAuthor, result) {
  const titleScore = titleSimilarity(queryTitle, result?.title)

  if (!queryAuthor || !result?.author) return titleScore

  const authorScore = titleSimilarity(queryAuthor, result.author)
  return Math.min(1, titleScore * 0.8 + authorScore * 0.2 + (authorScore > 0.6 ? 0.1 : 0))
}
