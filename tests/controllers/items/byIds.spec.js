/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const byIds = rewire('../../../src/controllers/items/byIds.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > byIds', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('returns multiple items', async () => {
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en'},
      {id: 2, name: 'Bar', lang: 'en'},
      {id: 3, name: 'FooBar', lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await byIds({params: {ids: '2,3'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 2, name: 'Bar'},
      {id: 3, name: 'FooBar'}
    ])
  })
})
