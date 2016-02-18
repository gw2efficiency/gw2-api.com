/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const Module = rewire('../../src/controllers/gem.js')

describe('controllers > gem', () => {
  let controller
  let cache
  beforeEach(() => {
    cache = {gemPriceHistory: {}}
    controller = new Module(cache)
  })

  it('handles /gems/history correctly', async () => {
    let content = {gold: [1, 2, 3], gems: [4, 5, 6]}
    let response = {send: sinon.spy()}
    cache.gemPriceHistory = content

    controller.handle(null, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
