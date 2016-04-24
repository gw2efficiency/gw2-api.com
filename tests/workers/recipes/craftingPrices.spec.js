/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')

const craftingPrices = rewire('../../../src/workers/recipes/craftingPrices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('workers > recipes > craftingPrices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('recipe-trees').deleteMany({})
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('calculates the crafting prices', async () => {
    await mongo.collection('recipe-trees').insert([
      {
        id: 30686,
        quantity: 1,
        output: 1,
        components: [
          {id: 46742, quantity: 1},
          {id: 29170, quantity: 1, components: [{id: 46747, quantity: 1}]},
          {id: 12324, quantity: 1}
        ]
      },
      {
        id: 1,
        quantity: 1,
        output: 1,
        components: [
          {id: 12324, quantity: 1}
        ]
      },
      {
        id: 3,
        quantity: 1,
        output: 5,
        components: [
          {id: 4, quantity: 1}
        ]
      },
      {
        id: 99,
        quantity: 1,
        output: 0.5,
        components: [
          {id: 4, quantity: 1}
        ]
      }
    ])

    await mongo.collection('items').insert([
      {id: 30686},
      {id: 1},
      {id: 3},
      {id: 99},
      {id: 46742, tradable: true, buy: {price: 100}, sell: {price: 200}},
      {id: 29170, tradable: true, buy: {price: 500}, sell: {price: 1000}},
      {id: 12324, tradable: true, buy: {price: 10000}, sell: {price: 20000}},
      {id: 4, tradable: true, buy: {price: 101}, sell: {price: 101}}
    ])

    await craftingPrices()

    let output = await mongo.collection('items')
      .find({id: {$in: [1, 3, 99, 30686]}}, {_id: 0})
      .sort({id: 1}).toArray()

    expect(output).to.deep.equal([
      // Non-legendary
      {
        id: 1,
        crafting: {
          buy: 8,
          sell: 8
        }
      },

      // Recipe output < 0
      {
        id: 3,
        crafting: {
          buy: 20,
          sell: 20
        }
      },

      // Recipe output > 0
      {
        id: 99,
        crafting: {
          buy: 202,
          sell: 202
        }
      },

      // Legendary
      {
        id: 30686,
        crafting: {
          buy: 258,
          buyNoDaily: 258,
          sell: 358,
          sellNoDaily: 358
        },
        craftingWithoutPrecursors: {
          buy: 608,
          buyNoDaily: 608,
          sell: 1208,
          sellNoDaily: 1208
        }
      }
    ])
  })
})
