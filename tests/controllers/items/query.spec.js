/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const query = rewire('../../../src/controllers/items/query.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > query', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})

    await mongo.collection('items').insertMany([
      {id: 1, name: 'Foo', lang: 'en', rarity: 0, category: [14, 2], buy: {price: 0}, sell: {price: 123}},
      {id: 2, name: 'Bar', lang: 'en', rarity: 1, category: [2], buy: {price: 123}, sell: {price: 456}},
      {id: 3, name: 'FooBar', lang: 'en', rarity: 2, craftable: true},
      {id: 4, name: 'Herp', lang: 'en', rarity: 4, category: [14, 6], buy: {price: 789}, sell: {price: 1011}},
      {id: 5, name: 'Hurp', lang: 'en', rarity: 4, category: [14, 3]}
    ])

    done()
  })

  it('returns all ids if no query is specified', async () => {
    let response = {send: sinon.spy()}
    await query({params: {ids: 'query'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([1, 2, 3, 4, 5])
  })

  it('returns only ids matching the rarity', async () => {
    let response = {send: sinon.spy()}
    await query({params: {ids: 'query', rarities: '1;2'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([2, 3])
  })

  it('returns only craftable items if the parameter is set', async () => {
    let response = {send: sinon.spy()}
    await query({params: {ids: 'query', craftable: '14'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([3])
  })

  it('returns only items excluding a string in their name', async () => {
    let response = {send: sinon.spy()}
    await query({params: {ids: 'query', exclude_name: 'Foo'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([2, 4, 5])
  })

  it('returns only items including a string in their name', async () => {
    let response = {send: sinon.spy()}
    await query({params: {ids: 'query', include_name: 'Foo'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([1, 3])
  })

  it('returns only items matching a specific category', async () => {
    let response = {send: sinon.spy()}
    await query({params: {ids: 'query', categories: '14'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([1, 4, 5])
  })

  it('returns only items matching multiple categories', async () => {
    let response = {send: sinon.spy()}

    await query({params: {ids: 'query', categories: '14,2'}}, response)
    expect(response.send.args[0][0]).to.deep.equal([1])

    await query({params: {ids: 'query', categories: '14,2;14,3'}}, response)
    expect(response.send.args[1][0]).to.deep.equal([1, 5])

    await query({params: {ids: 'query', categories: '14;2'}}, response)
    expect(response.send.args[2][0]).to.deep.equal([1, 2, 4, 5])

    await query({params: {ids: 'query', categories: '14,2;2'}}, response)
    expect(response.send.args[3][0]).to.deep.equal([1, 2])
  })

  it('returns the price breakdown if the parameter is set', async () => {
    let response = {send: sinon.spy()}
    await query({params: {ids: 'query', output: 'prices'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal({
      buy: {min: 0, avg: 304, max: 789},
      sell: {min: 123, avg: 530, max: 1011}
    })
  })
})
