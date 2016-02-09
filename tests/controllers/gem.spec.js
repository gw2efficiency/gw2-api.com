/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const Module = rewire('../../src/controllers/gem.js')

describe('controllers > GemController', () => {
  let worker
  let cache
  beforeEach(() => {
    cache = {gemPriceHistory: {}}
    worker = new Module(cache)
  })

  it('returns the cache object when handling requests', async () => {
    let content = {gold: [1, 2, 3], gems: [4, 5, 6]}
    let response = {send: sinon.spy(), cache: sinon.spy()}
    let next = sinon.spy()
    cache.gemPriceHistory = content

    worker.handle(null, response, next)
    expect(response.cache.calledOnce).to.equal(true)
    expect(response.send.calledOnce).to.equal(true)
    expect(next.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
