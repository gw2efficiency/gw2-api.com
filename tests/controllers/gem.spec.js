/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const controller = rewire('../../src/controllers/gem.js')

let storage = controller.__get__('storage')

describe('controllers > gem', () => {
  it('handles /gems/history', async () => {
    let content = {gold: [1, 2, 3], gems: [4, 5, 6]}
    let response = {send: sinon.spy()}
    storage.set('gemPriceHistory', content)

    controller.history(null, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
