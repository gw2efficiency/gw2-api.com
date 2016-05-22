/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const history = rewire('../../../src/controllers/gems/history.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > gems > history', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('cache').deleteMany({})
    done()
  })

  it('returns the gem history', async () => {
    let content = {gold: [1, 2, 3], gems: [4, 5, 6]}
    await mongo.collection('cache').insertOne({id: 'gemPriceHistory', content: content})

    let response = {send: sinon.spy()}
    await history(null, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
