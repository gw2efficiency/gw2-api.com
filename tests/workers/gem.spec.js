/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const worker = rewire('../../src/workers/gem.js')

const loggerMock = {success: sinon.spy()}
worker.__set__('logger', loggerMock)

const executeMock = sinon.spy()
const scheduleMock = sinon.spy()

worker.__set__('execute', executeMock)
worker.__set__('schedule', scheduleMock)

describe('workers > gem worker', () => {
  beforeEach(() => {
    loggerMock.success.reset()
    executeMock.reset()
    scheduleMock.reset()
    worker.__get__('storage').set('gemPriceHistory')
  })

  it('initializes correctly without data', async () => {
    await worker.initialize()

    expect(executeMock.calledOnce).to.equal(true)
    expect(executeMock.args[0][0].name).to.equal('loadGemPriceHistory')
    expect(scheduleMock.calledOnce).to.equal(true)
    expect(scheduleMock.args[0][0].name).to.equal('loadGemPriceHistory')
    expect(scheduleMock.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('initializes correctly with data', async () => {
    let storage = worker.__get__('storage')
    worker.__set__('storage', {
      set: () => true,
      get: () => 'we have data!'
    })
    await worker.initialize()

    expect(executeMock.callCount).to.equal(0)
    expect(scheduleMock.calledOnce).to.equal(true)
    expect(scheduleMock.args[0][0].name).to.equal('loadGemPriceHistory')
    expect(scheduleMock.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
    worker.__set__('storage', storage)
  })

  it('loads the gem price history', async () => {
    worker.__set__('scraping', {
      gemPriceHistory: () => ({
        gemsToGold: [1, 2, 3],
        goldToGems: [4, 5, 6]
      })
    })

    await worker.loadGemPriceHistory()
    expect(worker.__get__('storage').get('gemPriceHistory')).to.deep.equal({
      gold_to_gem: [4, 5, 6],
      gem_to_gold: [1, 2, 3]
    })
  })
})
