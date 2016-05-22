/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const all = rewire('../../../src/controllers/items/all.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > all', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('returns all tradable items', async () => {
    await mongo.collection('items').insertMany([
      {id: 1, name: 'Foo', lang: 'en'},
      {id: 2, name: 'Bar', lang: 'en', tradable: true},
      {id: 3, name: 'FooBar', lang: 'en', tradable: true},
      {id: 4, name: 'Herp', lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await all({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 2, name: 'Bar', tradable: true},
      {id: 3, name: 'FooBar', tradable: true}
    ])
  })
})
