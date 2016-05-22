/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const itemValues = rewire('../../../src/jobs/items/itemValues.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const jobMock = {log: () => false}
const doneMock = sinon.spy()

describe('jobs > items > itemValues', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    doneMock.reset()
    done()
  })

  it('calculates the item values', async () => {
    await mongo.collection('items').insertMany([
      {id: 1, lang: 'en', sell: {price: 123}},
      {id: 2, lang: 'en', buy: {price: 456}, value: 456},
      {id: 38506, lang: 'en', buy: {price: 555}, value: 10},
      {id: 66893, lang: 'en', sell: {price: 777}},
      {id: 66897, lang: 'en', value: 10},
      {id: 38507, lang: 'en', sell: {price: 12345}},
      {id: 73476, lang: 'en'}
    ])

    await itemValues(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let items = await mongo.collection('items')
      .find({lang: 'en'}, {_id: 0, lang: 0, valueIsVendor: 0})
      .sort({id: 1}).toArray()

    expect(items).to.deep.equal([
      {id: 1, sell: {price: 123}, value: 123},
      {id: 2, buy: {price: 456}, value: 456},
      {id: 38506, buy: {price: 555}, value: 555},
      {id: 38507, sell: {price: 12345}, value: 12345},
      {id: 66893, sell: {price: 777}, value: 777},
      {id: 66897, value: 777},
      {id: 73476, value: 100000}
    ])
  })

  it('calculates the item values for ascended boxes', async () => {
    await mongo.collection('items').insertMany([
      {
        id: 123,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        sell: {price: 100},
        lang: 'en',
        category: [0]
      },
      {
        id: 124,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        lang: 'en',
        category: [0]
      },
      {
        id: 125,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        sell: {price: 200},
        lang: 'en',
        category: [14]
      },
      {
        id: 126,
        name: 'wupwup item',
        rarity: 6,
        craftable: false,
        sell: {price: 300},
        lang: 'en',
        category: [14]
      },
      {
        id: 127,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        sell: {price: 400},
        lang: 'en',
        category: [3]
      },
      {
        id: 128,
        name: 'wupwup item',
        rarity: 5,
        craftable: true,
        sell: {price: 500},
        lang: 'en',
        category: [14]
      },
      {
        id: 129,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        vendor_price: 600,
        sell: {price: 600},
        lang: 'en',
        category: [14]
      },
      {
        id: 130,
        name: 'Nightfury',
        rarity: 6,
        craftable: true,
        sell: {price: 700},
        lang: 'en',
        category: [14]
      },
      {id: 1, rarity: 6, category: [4, 0], lang: 'en', sell: {price: 1}, name: 'Wupwup Chest'},
      {id: 2, rarity: 6, category: [4, 0], lang: 'en', sell: {price: 1}, name: 'Recipe for something'},
      {id: 3, rarity: 6, category: [4, 1], lang: 'en', sell: {price: 1}, name: 'Another Chest'},
      {id: 4, rarity: 6, category: [4, 1], lang: 'en', sell: {price: 1}, name: 'Worldboss Hoard'}
    ])

    await itemValues(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let items = await mongo.collection('items')
      .find({lang: 'en', id: {$in: [1, 2, 3, 4]}}, {_id: 0, id: 1, value: 1})
      .sort({id: 1}).toArray()

    expect(items).to.deep.equal([
      {id: 1, value: 150},
      {id: 2, value: 1},
      {id: 3, value: 150},
      {id: 4, value: 150}
    ])
  })
})
