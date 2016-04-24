/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')

const skinPrices = rewire('../../../src/workers/skins/skinPrices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('workers > skins > skinPrices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('cache').deleteMany({})
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('calculates the skin prices', async () => {
    await mongo.collection('items').insert([
      {id: 1, tradable: true, lang: 'en', value: 123, valueIsVendor: false},
      {id: 2, tradable: true, lang: 'en', value: 456, valueIsVendor: false},
      {id: 3, tradable: true, lang: 'en', value: 789, valueIsVendor: true},
      {id: 4, tradable: true, lang: 'en'},
      {id: 5, tradable: true, lang: 'en', value: 999, valueIsVendor: false},
      {id: 6, tradable: true, lang: 'en', value: 500, valueIsVendor: false}
    ])
    await mongo.collection('cache').insert({
      id: 'skinsToItems',
      content: {
        71: [1],
        72: [2],
        73: [3],
        74: [4],
        75: [1, 2, 3, 4],
        76: [5, 2],
        77: [20319],
        78: [5, 1337],
        79: [3, 5, 6]
      }
    })

    await skinPrices()

    let prices = (await mongo.collection('cache')
      .find({id: 'skinPrices'})
      .limit(1).next()).content

    expect(prices).to.deep.equal({
      71: 123,
      72: 456,
      75: 123,
      76: 456,
      78: 999,
      79: 500
    })
  })
})
