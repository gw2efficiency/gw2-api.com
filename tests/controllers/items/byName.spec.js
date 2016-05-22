/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const byName = rewire('../../../src/controllers/items/byName.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > byName', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('returns all exact name matches', async () => {
    await mongo.collection('items').insertMany([
      {id: 1, name: 'Foo', lang: 'en', tradable: false},
      {id: 2, name: 'Bar', lang: 'en', tradable: true},
      {id: 3, name: 'FooBar', lang: 'en', tradable: true}
    ])

    let response = {send: sinon.spy()}
    await byName({params: {ids: 'by-name', names: 'Foo,bAr'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, name: 'Foo', tradable: false}
    ])
  })

  it('returns an error if the request has invalid parameters', async () => {
    let response = {send: sinon.spy()}
    await byName({params: {ids: 'by-name'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })
})
