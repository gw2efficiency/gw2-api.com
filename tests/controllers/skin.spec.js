/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const controller = rewire('../../src/controllers/skin.js')
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > skin', () => {
  before(async () => {
    await mongo.connect('mongodb://localhost:27017/gw2api-test')
  })

  beforeEach(async () => {
    await mongo.collection('cache').deleteMany({})
  })

  it('handles /skins/resolve', async () => {
    let content = {'1': [1, 2], '2': [3, 4]}
    await mongo.collection('cache').insert({id: 'skinsToItems', content: content})

    let response = {send: sinon.spy()}
    await controller.resolve(null, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
