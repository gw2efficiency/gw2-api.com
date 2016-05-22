/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const allValues = rewire('../../../src/controllers/items/allValues.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > allValues', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('returns the values of all items that have a value', async () => {
    await mongo.collection('items').insertMany([
      {id: 1, lang: 'en', value: 123},
      {id: 2, lang: 'en', value: 456},
      {id: 3, lang: 'en'},
      {id: 4, lang: 'en', value: 910}
    ])

    let response = {send: sinon.spy()}
    await allValues({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, value: 123},
      {id: 2, value: 456},
      {id: 4, value: 910}
    ])
  })
})
