/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const lastKnownPrices = rewire('../../../src/jobs/items/lastKnownPrices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const jobMock = {log: () => false}
const doneMock = sinon.spy()

describe('jobs > items > lastKnownPrices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    doneMock.reset()
    done()
  })

  it('loads the missing item prices', async () => {
    await mongo.collection('items').insert([
      {id: 1, name: 'Fiz', lang: 'en', tradable: true, sell: {quantity: 0, last_known: false}}
    ])

    lastKnownPrices.__set__('requester', {
      single: () => ({
        last_page: 1,
        results: [{quantity: 10, unit_price: 10}]
      })
    })

    await lastKnownPrices(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let item = await mongo.collection('items').find({id: 1}, {_id: 0}).limit(1).next()
    expect(item).to.deep.equal(
      {id: 1, name: 'Fiz', lang: 'en', tradable: true, sell: {quantity: 0, last_known: 10}}
    )
  })
})
