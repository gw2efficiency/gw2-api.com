/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const byId = rewire('../../../src/controllers/items/byId.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > byId', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('returns a single item', async () => {
    await mongo.collection('items').insertMany([
      {id: 1, name: 'Foo', lang: 'en'},
      {id: 2, name: 'Bar', lang: 'en'},
      {id: 3, name: 'FooBar', lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await byId({params: {id: 2}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal({id: 2, name: 'Bar'})
  })

  it('returns an error if the item does not exist', async () => {
    let response = {send: sinon.spy()}
    await byId({params: {id: 999}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(404)
    expect(response.send.args[0][1]).to.deep.equal({text: 'no such id'})
  })

  it('returns an error if the request has invalid parameters', async () => {
    let response = {send: sinon.spy()}
    await byId({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })
})
