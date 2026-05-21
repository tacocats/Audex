import sanitizeHtml from 'sanitize-html'

export function sanitize(html) {
  if (typeof html !== 'string') return ''
  return sanitizeHtml(html, {
    allowedTags: ['p', 'ol', 'ul', 'li', 'a', 'strong', 'em', 'del', 'br', 'b', 'i'],
    disallowedTagsMode: 'discard',
    allowedAttributes: { a: ['href', 'name', 'target'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false
  })
}

export function stripAllTags(html) {
  if (typeof html !== 'string') return ''
  return sanitizeHtml(html, { allowedTags: [], disallowedTagsMode: 'discard' })
}
