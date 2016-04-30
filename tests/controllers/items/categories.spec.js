/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const categories = rewire('../../../src/controllers/items/categories.js')

describe('controllers > items > categories', () => {
  it('returns the item categories', async () => {
    let response = {send: sinon.spy()}
    await categories({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.be.an.object
    expect(Object.keys(response.send.args[0][0]).length).to.be.above(10)
  })
})
