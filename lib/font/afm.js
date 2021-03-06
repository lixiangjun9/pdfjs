'use strict'

const PDFName = require('../object/name')
const PDFObject = require('../object/object')
const PDFString = require('../object/string')
const PDFArray = require('../object/array')
const Base = require('./base')

module.exports = class AFMFont extends Base {
  constructor(data) {
    super()

    this._data = data
    this.ascent = this._data.ascender
    this.descent = this._data.descender
    this.lineGap = (this._data.fontBBox[3] - this._data.fontBBox[1]) - (this.ascent - this.descent)
  }

  encode(str) {
    let encoded = ''
    for (let i = 0, len = str.length; i < len; ++i) {
      switch (str[i]) {
      case '\\':
        encoded += '\\\\'
        break
      case '(':
        encoded += '\\('
        break
      case ')':
        encoded += '\\)'
        break
      default:
        encoded += String.fromCharCode(this._charCodeFor(str[i]))
      }
    }

    return '(' + encoded + ')'
  }

  _charCodeFor(c) {
    return c in UNICODE_TO_WIN1252
      ? UNICODE_TO_WIN1252[c]
      : c.charCodeAt(0)
  }

  stringWidth(str, size) {
    let width = 0
    for (let i = 0, len = str.length; i < len; ++i) {
      const left = this._charCodeFor(str[i])

      const advanceWidth = this._data.widths[left]
      if (advanceWidth) {
        width += advanceWidth
      }

      // TODO: re-enable, however while this adjusts the string widths correctly, the font kerning
      // is not properly applied in the PDF currently (also break text alignmen justify)
      // kerning
      // if (str[i + 1] !== undefined && left in this._data.kerning) {
      //   const right = this._charCodeFor(str[i + 1])
      //   const offset = this._data.kerning[left][right]
      //   if (offset !== undefined) {
      //     width += offset
      //   }
      // }
    }

    const scale = size / 1000
    return width * scale
  }

  lineHeight(size, includeGap) {
    if (includeGap == null) {
      includeGap = false
    }

    const gap = includeGap ? (this.lineGap) : 0

    return (this.ascent - this.descent) * size / 1000
  }

  lineDescent(size) {
    return this._data.descender * size / 1000
  }

  async write(doc, fontObj) {
    const descriptor = new PDFObject('FontDescriptor')
    descriptor.prop('FontName', this._data.fontName)
    descriptor.prop('FontBBox', new PDFArray(this._data.fontBBox))
    descriptor.prop('ItalicAngle', this._data.italicAngle)
    descriptor.prop('Ascent', this.ascent)
    descriptor.prop('Descent', this.descent)
    descriptor.prop('XHeight', this._data.xHeight)
    descriptor.prop('CapHeight', this._data.capHeight)
    descriptor.prop('StemV', 0)

    fontObj.prop('Subtype', 'Type1')
    fontObj.prop('BaseFont', this._data.fontName)
    fontObj.prop('Encoding', 'WinAnsiEncoding')
    fontObj.prop('FontDescriptor', descriptor.toReference())

    await doc._writeObject(descriptor)
    await doc._writeObject(fontObj)
  }
}

// only the once different from ISO-8859-1 are relevant, see
// https://en.wikipedia.org/wiki/Windows-1252
const UNICODE_TO_WIN1252 = {
  '\u20ac': 128,
  '\u201a': 130,
  '\u0192': 131,
  '\u201e': 132,
  '\u2026': 133,
  '\u2020': 134,
  '\u2021': 135,
  '\u02c6': 136,
  '\u2030': 137,
  '\u0160': 138,
  '\u2039': 139,
  '\u0152': 140,
  '\u017d': 142,
  '\u2018': 145,
  '\u2019': 146,
  '\u201c': 147,
  '\u201d': 148,
  '\u2022': 149,
  '\u2013': 150,
  '\u2014': 151,
  '\u02dc': 152,
  '\u2122': 153,
  '\u0161': 154,
  '\u203a': 155,
  '\u0153': 156,
  '\u017e': 158,
  '\u0178': 159
}