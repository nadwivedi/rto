const test = require('node:test')
const assert = require('node:assert')
const { sourceOf } = require('../utils/serverLogs')

test('server logs: source is the [TAG] or the API name a line starts with', () => {
  assert.strictEqual(sourceOf('[API 8] CG04AB1234 ref RTOS1 -> url REFUSED: HTTP 401 {}'), 'API 8')
  assert.strictEqual(sourceOf('[Chassis to RC] ABC: HTTP 500'), 'Chassis to RC')
  assert.strictEqual(sourceOf('API 8 – Satmat API lookup failed: boom'), 'API 8')
  assert.strictEqual(sourceOf('MongoDB connected successfully'), undefined)
})
