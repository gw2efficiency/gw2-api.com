/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const allPrices = rewire('../../../src/controllers/items/allPrices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > allPrices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('returns the prices of all tradable items', async () => {
    await mongo.collection('items').insertMany([
      {id: 1, lang: 'en', tradable: true, buy: {price: 0}, sell: {price: 123}},
      {id: 2, lang: 'en', tradable: true, buy: {price: 456}, sell: {price: 0}},
      {id: 3, lang: 'en', tradable: true},
      {id: 4, lang: 'en', tradable: true, vendor_price: 910},
      {id: 5, lang: 'en', tradable: false}
    ])

    let response = {send: sinon.spy()}
    await allPrices({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, price: 123},
      {id: 2, price: 456},
      {id: 4, price: 910}
    ])
  })
})
