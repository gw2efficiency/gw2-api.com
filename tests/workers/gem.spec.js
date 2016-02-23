/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const Module = rewire('../../src/workers/gem.js')

const loggerMock = {success: sinon.spy()}
Module.__set__('logger', loggerMock)

describe('workers > gem', () => {
  let worker
  let api
  let cache
  beforeEach(() => {
    loggerMock.success.reset()
    api = sinon.spy()
    cache = {}
    worker = new Module(api, cache)
  })

  it('initializes correctly', async () => {
    worker.execute = sinon.spy()
    worker.schedule = sinon.spy()

    await worker.initialize()

    expect(worker.execute.callCount).to.equal(0)
    expect(worker.schedule.calledOnce).to.equal(true)
    expect(worker.schedule.args[0][0].name).to.equal('loadGemPriceHistory')
    expect(worker.schedule.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('initializes correctly when forced to load initial data', async () => {
    worker.execute = sinon.spy()
    worker.schedule = sinon.spy()

    await worker.initialize(true)

    expect(worker.execute.calledOnce).to.equal(true)
    expect(worker.execute.args[0][0].name).to.equal('loadGemPriceHistory')
    expect(worker.schedule.calledOnce).to.equal(true)
    expect(worker.schedule.args[0][0].name).to.equal('loadGemPriceHistory')
    expect(worker.schedule.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('loads the gem price history', async () => {
    Module.__set__('scraping', {
      gemPriceHistory: () => ({
        gemsToGold: [1, 2, 3],
        goldToGems: [4, 5, 6]
      })
    })

    await worker.loadGemPriceHistory()
    expect(cache.gemPriceHistory).to.deep.equal({
      gold_to_gem: [4, 5, 6],
      gem_to_gold: [1, 2, 3]
    })
  })
})
