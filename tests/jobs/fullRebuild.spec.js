/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const fullRebuild = rewire('../../src/jobs/fullRebuild.js')
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const jobMock = {log: () => false}
const doneMock = sinon.spy()

const jobs = [
  'itemList',
  'itemPrices',
  'itemValues',
  'lastKnownSellPrices',
  'recipeList',
  'craftingPrices',
  'skinList',
  'skinPrices',
  'gemPriceHistory'
]

jobs.map(job => fullRebuild.__set__(job, async (j, d) => d()))

describe('jobs > fullRebuild', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    doneMock.reset()
    done()
  })

  it('executes a full rebuild', async () => {
    await fullRebuild(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)
  })
})
