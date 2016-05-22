/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const prices = rewire('../../../src/controllers/skins/prices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > skins > prices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('cache').deleteMany({})
    done()
  })

  it('returns the list of skin prices', async () => {
    let content = {1: 123, 2: 456}
    await mongo.collection('cache').insertOne({id: 'skinPrices', content: content})

    let response = {send: sinon.spy()}
    await prices(null, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
