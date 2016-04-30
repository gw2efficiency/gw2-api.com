/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const resolve = rewire('../../../src/controllers/skins/resolve.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > skins > resolve', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('cache').deleteMany({})
    done()
  })

  it('returns the list of skins to items', async () => {
    let content = {'1': [1, 2], '2': [3, 4]}
    await mongo.collection('cache').insert({id: 'skinsToItems', content: content})

    let response = {send: sinon.spy()}
    await resolve(null, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
