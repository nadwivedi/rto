const test = require('node:test')
const assert = require('node:assert')
const { sourceOf } = require('../utils/serverLogs')

test('server logs: source is the [TAG] or the API name a line starts with', () => {
  assert.strictEqual(sourceOf('[API 8] CG04AB1234 ref RTOS1 -> url REFUSED: HTTP 401 {}'), 'API 8')
  assert.strictEqual(sourceOf('[Chassis to RC] ABC: HTTP 500'), 'Chassis to RC')
  assert.strictEqual(sourceOf('API 8 – Satmat API lookup failed: boom'), 'API 8')
  assert.strictEqual(sourceOf('MongoDB connected successfully'), undefined)
})

const { withLogContext, getLogContext } = require('../utils/logContext')

test('log context: kept across awaits and nested calls, gone outside', async () => {
  assert.strictEqual(getLogContext(), undefined)
  const seen = await withLogContext({ vehicleNumber: 'CG04AB1234', userId: 'u1', via: 'User search', staffId: '' }, async () => {
    await new Promise((resolve) => setTimeout(resolve, 5))
    const inner = await withLogContext({ via: 'API key: Fleet App' }, async () => getLogContext())
    return { outer: getLogContext(), inner }
  })
  assert.deepStrictEqual(seen.outer, { vehicleNumber: 'CG04AB1234', userId: 'u1', via: 'User search' })
  assert.deepStrictEqual(seen.inner, { vehicleNumber: 'CG04AB1234', userId: 'u1', via: 'API key: Fleet App' })
  assert.strictEqual(getLogContext(), undefined)
})
