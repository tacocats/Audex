// Extracts normalized title and author from raw ffprobe tag objects across varying tag naming conventions

const TITLE_FIELDS = ['title', 'TITLE']
const ALBUM_FIELDS = ['album', 'ALBUM']
const AUTHOR_FIELDS = ['author', 'AUTHOR', 'artist', 'ARTIST', 'album_artist', 'ALBUM_ARTIST', 'composer', 'COMPOSER']

export function extractTitle(tags) {
  for (const field of TITLE_FIELDS) {
    if (tags[field]) return tags[field]
  }
  return null
}

export function extractAuthor(tags) {
  for (const field of AUTHOR_FIELDS) {
    if (tags[field]) return tags[field]
  }
  return null
}

export function extractAlbum(tags) {
  for (const field of ALBUM_FIELDS) {
    if (tags[field]) return tags[field]
  }
  return null
}
