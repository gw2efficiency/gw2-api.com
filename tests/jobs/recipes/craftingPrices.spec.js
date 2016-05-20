/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const craftingPrices = rewire('../../../src/jobs/recipes/craftingPrices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const jobMock = {log: () => false}
const doneMock = sinon.spy()

describe('jobs > recipes > craftingPrices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    doneMock.reset()
    await mongo.collection('recipe-trees').deleteMany({})
    await mongo.collection('items').deleteMany({})

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

    done()
  })

  it('calculates the crafting prices for normal recipes', async () => {
    await craftingPrices(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let output = await mongo.collection('items')
      .find({id: 1}, {_id: 0})
      .limit(1).next()

    expect(output).to.deep.equal({
      id: 1,
      crafting: {
        buy: 8,
        sell: 8
      }
    })
  })

  it('calculates the crafting prices for recipes with output > 1', async () => {
    await craftingPrices(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let output = await mongo.collection('items')
      .find({id: 3}, {_id: 0})
      .limit(1).next()

    expect(output).to.deep.equal({
      id: 3,
      crafting: {
        buy: 20,
        sell: 20
      }
    })
  })

  it('calculates the crafting prices for recipes with output < 1', async () => {
    await craftingPrices(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let output = await mongo.collection('items')
      .find({id: 99}, {_id: 0})
      .limit(1).next()

    expect(output).to.deep.equal({
      id: 99,
      crafting: {
        buy: 202,
        sell: 202
      }
    })
  })

  it('calculates the crafting prices for legendaries', async () => {
    await craftingPrices(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let output = await mongo.collection('items')
      .find({id: 30686}, {_id: 0})
      .limit(1).next()

    expect(output).to.deep.equal({
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
    })
  })
})
