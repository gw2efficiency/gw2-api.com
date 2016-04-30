/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')

const gemPriceHistory = rewire('../../../src/workers/gems/gemPriceHistory.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('workers > gems > gemPriceHistory', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('cache').deleteMany({})
    done()
  })

  it('loads the gem price history', async () => {
    gemPriceHistory.__set__('scraping', {
      gemPriceHistory: () => ({
        gemsToGold: [1, 2, 3],
        goldToGems: [4, 5, 6]
      })
    })

    await gemPriceHistory()

    let content = (await mongo.collection('cache').find({id: 'gemPriceHistory'}).limit(1).next()).content
    expect(content).to.deep.equal({
      gold_to_gem: [4, 5, 6],
      gem_to_gold: [1, 2, 3]
    })
  })
})
