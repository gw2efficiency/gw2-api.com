/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const Module = rewire('../../src/controllers/skin.js')

describe('controllers > skin', () => {
  let controller
  let cache
  beforeEach(() => {
    cache = {skinsToItems: {}}
    controller = new Module(cache)
  })

  it('handles /skins/resolve', async () => {
    let content = {'1': [1, 2], '2': [3, 4]}
    let response = {send: sinon.spy()}
    cache.skinsToItems = content

    controller.resolve(null, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
