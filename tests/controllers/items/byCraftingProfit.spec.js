/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const byCraftingProfit = rewire('../../../src/controllers/items/byCraftingProfit.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > recipes > byCraftingProfit', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    await mongo.collection('cache').deleteMany({})
    done()
  })

  it('returns recipes ordered by profit', async () => {
    let items = [
      {id: 1, craftable: false, name: 'Foo', lang: 'en'},
      {id: 2, craftable: true, name: 'Bar', lang: 'en', craftingProfit: 200},
      {id: 3, craftable: true, name: 'Foo Bar', lang: 'en', craftingProfit: 100},
      {id: 4, craftable: true, name: 'Herp', lang: 'en', craftingProfit: 9999}
    ]
    await mongo.collection('items').insertMany(items)

    let response = {send: sinon.spy()}
    await byCraftingProfit({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal({
      totalResults: 3,
      results: [
        {id: 4, craftable: true, name: 'Herp', craftingProfit: 9999},
        {id: 2, craftable: true, name: 'Bar', craftingProfit: 200},
        {id: 3, craftable: true, name: 'Foo Bar', craftingProfit: 100}
      ]
    })
  })

  it('returns another page of recipes', async () => {
    let items = [
      {id: 1, craftable: false, name: 'Foo', lang: 'en'},
      {id: 2, craftable: true, name: 'Bar', lang: 'en', craftingProfit: 200},
      {id: 3, craftable: true, name: 'Foo Bar', lang: 'en', craftingProfit: 100},
      {id: 4, craftable: true, name: 'Herp', lang: 'en', craftingProfit: 9999}
    ]
    await mongo.collection('items').insertMany(items)

    let response = {send: sinon.spy()}
    byCraftingProfit.__set__('pageSize', 2)
    await byCraftingProfit({params: {page: 1}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal({
      totalResults: 3,
      results: [
        {id: 3, craftable: true, name: 'Foo Bar', craftingProfit: 100}
      ]
    })
  })
})
