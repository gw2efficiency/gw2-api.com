/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const worker = rewire('../../src/workers/gem.js')
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const executeMock = sinon.spy()
worker.__set__('execute', executeMock)

const scheduleMock = sinon.spy()
worker.__set__('schedule', scheduleMock)

describe('workers > gem worker', () => {
  before(async () => {
    await mongo.connect('mongodb://localhost:27017/gw2api-test')
  })

  beforeEach(async () => {
    await mongo.collection('cache').deleteMany({})
    executeMock.reset()
    scheduleMock.reset()
  })

  it('initializes correctly without data', async () => {
    await worker.initialize()

    expect(executeMock.callCount).to.equal(1)
    expect(executeMock.args[0][0].name).to.equal('loadGemPriceHistory')

    expect(scheduleMock.callCount).to.equal(1)
    expect(scheduleMock.args[0][1].name).to.equal('loadGemPriceHistory')
  })

  it('initializes correctly with data', async () => {
    await mongo.collection('cache').insert({id: 'gemPriceHistory', content: 'i am some content'})
    await worker.initialize()

    expect(executeMock.callCount).to.equal(0)

    expect(scheduleMock.callCount).to.equal(1)
    expect(scheduleMock.args[0][1].name).to.equal('loadGemPriceHistory')
  })

  it('loads the gem price history', async () => {
    worker.__set__('scraping', {
      gemPriceHistory: () => ({
        gemsToGold: [1, 2, 3],
        goldToGems: [4, 5, 6]
      })
    })

    await worker.loadGemPriceHistory()

    let content = (await mongo.collection('cache').find({id: 'gemPriceHistory'}).limit(1).next()).content
    expect(content).to.deep.equal({
      gold_to_gem: [4, 5, 6],
      gem_to_gold: [1, 2, 3]
    })
  })
})
