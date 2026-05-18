import sanitizeHtml from '../libs/sanitizeHtml.js'
import { entities } from './htmlEntities.js'

/**
 *
 * @param {string} html
 * @returns {string}
 */
export function sanitize(html) {
  if (typeof html !== 'string') {
    return ''
  }

  const sanitizerOptions = {
    allowedTags: ['p', 'ol', 'ul', 'li', 'a', 'strong', 'em', 'del', 'br', 'b', 'i'],
    disallowedTagsMode: 'discard',
    allowedAttributes: {
      a: ['href', 'name', 'target']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false
  }

  return sanitizeHtml(html, sanitizerOptions)
}
export function stripAllTags(html, shouldDecodeEntities = true) {
  if (typeof html !== 'string') return ''

  const sanitizerOptions = {
    allowedTags: [],
    disallowedTagsMode: 'discard'
  }

  let sanitized = sanitizeHtml(html, sanitizerOptions)
  return shouldDecodeEntities ? decodeHTMLEntities(sanitized) : sanitized
}
function decodeHTMLEntities(strToDecode) {
  return strToDecode.replace(/\&([^;]+);?/g, function (entity) {
    if (entity in entities) {
      return entities[entity]
    }
    return entity
  })
}
