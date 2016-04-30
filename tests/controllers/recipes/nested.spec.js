/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const nested = rewire('../../../src/controllers/recipes/nested.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > recipes > nested', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('recipe-trees').deleteMany({})
    await mongo.collection('cache').deleteMany({})
    done()
  })

  it('returns the nested recipe tree', async () => {
    let recipes = [
      {id: 1, ingredients: [1, 2, 3]},
      {id: 2, ingredients: [4, 5, 6]},
      {id: 3, ingredients: [4, 5, 6]}
    ]
    await mongo.collection('recipe-trees').insert(recipes)

    let response = {send: sinon.spy()}
    await nested({params: {id: 2}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal({id: 2, ingredients: [4, 5, 6]})
  })

  it('returns an error if the recipe does not exist', async () => {
    let response = {send: sinon.spy()}
    await nested({params: {id: 999}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(404)
    expect(response.send.args[0][1]).to.deep.equal({text: 'no such id'})
  })

  it('returns an error if the request has invalid parameters', async () => {
    let response = {send: sinon.spy()}
    await nested({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })
})
