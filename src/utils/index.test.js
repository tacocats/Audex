import { isValidASIN } from './index.js'

describe('isValidASIN', () => {
  it.each([
    'B08G9PRS1K',
    'B00I3LZEH8',
    'A1B2C3D4E5',
    '1234567890'
  ])('returns true for valid ASIN %p', (asin) => {
    expect(isValidASIN(asin)).toBe(true)
  })

  it.each([
    ['too short', 'B08G9PRS1'],
    ['too long', 'B08G9PRS1KK'],
    ['lowercase letters', 'b08g9prs1k'],
    ['special characters', 'B08G9PRS1!'],
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['number', 1234567890]
  ])('returns false for %s', (_, input) => {
    expect(isValidASIN(input)).toBe(false)
  })
})
