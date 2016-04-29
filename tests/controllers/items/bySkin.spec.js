/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const bySkin = rewire('../../../src/controllers/items/bySkin.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > bySkin', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('returns all items unlocking the skin', async () => {
    await mongo.collection('items').insert([
      {id: 1, skins: [42], lang: 'en'},
      {id: 2, lang: 'en'},
      {id: 3, skins: [123], lang: 'en'},
      {id: 4, skins: [10, 42], lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await bySkin({params: {ids: 'by-skin', skin_id: '42'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([1, 4])
  })

  it('returns an error if the request has invalid parameters', async () => {
    let response = {send: sinon.spy()}
    await bySkin({params: {ids: 'by-skin'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })
})
