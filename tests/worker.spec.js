/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')
const itemWorkerSpy = sinon.spy()
const gemWorkerSpy = sinon.spy()
const skinWorkerSpy = sinon.spy()

proxyquire('../src/worker.js', {
  './workers/item.js': {initialize: itemWorkerSpy},
  './workers/gem.js': {initialize: gemWorkerSpy},
  './workers/skin.js': {initialize: skinWorkerSpy},
  './helpers/sharedStorage.js': {load: () => new Promise(resolve => resolve())}
})

describe('workers', () => {
  it('initializes the workers', () => {
    expect(gemWorkerSpy.called).to.equal(true)
    expect(itemWorkerSpy.called).to.equal(true)
    expect(skinWorkerSpy.called).to.equal(true)
  })
})
