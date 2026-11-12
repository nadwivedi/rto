const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { splitRanges } = require('../jobs/emailDataExport')

test('splitRanges keeps a small file in one part', () => {
  assert.deepStrictEqual(splitRanges(10, 14), [{ start: 0, end: 9 }])
})

test('splitRanges cuts a big file into parts no bigger than the limit', () => {
  const ranges = splitRanges(35, 14)
  assert.deepStrictEqual(ranges, [{ start: 0, end: 13 }, { start: 14, end: 27 }, { start: 28, end: 34 }])
  for (const r of ranges) assert.ok(r.end - r.start + 1 <= 14)
})

test('splitRanges at an exact multiple has no empty last part', () => {
  assert.deepStrictEqual(splitRanges(28, 14), [{ start: 0, end: 13 }, { start: 14, end: 27 }])
})

test('parts read with the ranges join back into the same file', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'))
  const file = path.join(dir, 'data.zip')
  const data = Buffer.from(Array.from({ length: 100003 }, (_, i) => i % 251))
  fs.writeFileSync(file, data)

  const parts = []
  for (const range of splitRanges(data.length, 7000)) {
    const chunks = []
    for await (const chunk of fs.createReadStream(file, range)) chunks.push(chunk)
    parts.push(Buffer.concat(chunks))
  }

  assert.ok(parts.length > 1)
  assert.ok(Buffer.concat(parts).equals(data))
  fs.rmSync(dir, { recursive: true, force: true })
})
