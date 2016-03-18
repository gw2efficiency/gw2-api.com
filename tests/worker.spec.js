/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')
const itemWorkerSpy = sinon.spy()
const gemWorkerSpy = sinon.spy()
const skinWorkerSpy = sinon.spy()
const recipeWorkerSpy = sinon.spy()

const mongo = require('../src/helpers/mongo.js')
mongo.logger.quiet(true)

proxyquire('../src/worker.js', {
  './workers/item.js': {initialize: itemWorkerSpy},
  './workers/gem.js': {initialize: gemWorkerSpy},
  './workers/skin.js': {initialize: skinWorkerSpy},
  './workers/recipe.js': {initialize: recipeWorkerSpy}
})

describe('worker setup', () => {
  before(async () => {
    await mongo.connect('mongodb://localhost:27017/gw2api-test')
  })

  it('initializes the workers', () => {
    expect(gemWorkerSpy.called).to.equal(true)
    expect(itemWorkerSpy.called).to.equal(true)
    expect(skinWorkerSpy.called).to.equal(true)
    expect(recipeWorkerSpy.called).to.equal(true)
  })
})
