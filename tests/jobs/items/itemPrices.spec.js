/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const itemPrices = rewire('../../../src/jobs/items/itemPrices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const jobMock = {log: () => false}
const doneMock = sinon.spy()

// Get the function to create iso dates form the transformation module
const isoDate = rewire('../../../src/jobs/items/_transformPrices.js').__get__('isoDate')

describe('jobs > items > itemPrices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    doneMock.reset()
    done()
  })

  it('loads the item prices', async () => {
    let currentDate = isoDate()

    await mongo.collection('items').insert([
      {id: 1, name: 'Test Item', lang: 'en', tradable: true},
      {id: 2, name: 'Another test item', tradable: false, lang: 'en'}
    ])

    itemPrices.__set__('api', () => ({
      commerce: () => ({
        prices: () => ({
          all: () => new Promise(r => r([{
            id: 1,
            buys: {
              quantity: 29731,
              unit_price: 58
            },
            sells: {
              quantity: 42594,
              unit_price: 133
            }
          }, {
            id: 2,
            buys: {
              quantity: 29731,
              unit_price: 58
            },
            sells: {
              quantity: 42594,
              unit_price: 133
            }
          }]))
        })
      })
    }))

    await itemPrices(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let items = await mongo.collection('items')
      .find({lang: 'en'}, {_id: 0, lang: 0})
      .sort({id: 1}).toArray()

    expect(items).to.deep.equal([
      {
        id: 1,
        name: 'Test Item',
        buy: {
          quantity: 29731,
          price: 58,
          last_change: {quantity: 0, price: 0, time: currentDate},
          last_known: 58
        },
        sell: {
          quantity: 42594,
          price: 133,
          last_change: {quantity: 0, price: 0, time: currentDate},
          last_known: 133
        },
        last_update: currentDate,
        tradable: true
      },
      {id: 2, name: 'Another test item', tradable: false}
    ])
  })
})
