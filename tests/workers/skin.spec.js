/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const Module = rewire('../../src/workers/skin.js')

const loggerMock = {success: sinon.spy(), info: sinon.spy()}
Module.__set__('logger', loggerMock)

describe('workers > skin', () => {
  let worker
  let api
  let cache
  beforeEach(() => {
    loggerMock.success.reset()
    loggerMock.info.reset()
    api = sinon.spy()
    cache = {}
    worker = new Module(api, cache)
  })

  it('initializes correctly', async () => {
    worker.execute = sinon.spy()
    worker.schedule = sinon.spy()

    await worker.initialize()

    expect(worker.execute.callCount).to.equal(0)
    expect(worker.schedule.calledOnce).to.equal(true)
    expect(worker.schedule.args[0][0].name).to.equal('loadSkinList')
    expect(worker.schedule.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('initializes correctly when forced to load initial data', async () => {
    worker.execute = sinon.spy()
    worker.schedule = sinon.spy()

    await worker.initialize(true)

    expect(worker.execute.calledOnce).to.equal(true)
    expect(worker.execute.args[0][0].name).to.equal('loadSkinList')
    expect(worker.schedule.calledOnce).to.equal(true)
    expect(worker.schedule.args[0][0].name).to.equal('loadSkinList')
    expect(worker.schedule.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('loads the skins and resolves into items', async () => {
    worker.cache = {
      items: {
        en: [
          {id: 1, name: 'Foo', skin: 1},
          {id: 2, name: 'Bar'},
          {id: 3, name: 'Bar    '},
          {id: 4, name: 'Some Skin'},
          {id: 5, name: 'Something about cake'}
        ]
      }
    }

    worker.api = () => ({
      skins: () => ({
        all: () => [
          {id: 1, name: 'Foo'},
          {id: 2, name: 'Bar'},
          {id: 3, name: 'Some'},
          {id: 4, name: 'cake'},
          {id: 5, name: 'herp'}
        ]
      })
    })

    await worker.loadSkinList()
    expect(worker.cache.skinsToItems).to.deep.equal({
      '1': [1],
      '2': [2, 3],
      '3': [4],
      '4': [5],
      '5': []
    })

    expect(loggerMock.info.calledOnce).to.equal(true)
  })

  it('resolves skins correctly', () => {
    let resolve = Module.__get__('resolveSkin')
    let items = [
      {id: 1, name: 'Foo', skin: 1},
      {id: 2, name: 'Bar'},
      {id: 3, name: 'Bar'},
      {id: 4, name: 'Some Skin'},
      {id: 5, name: 'Something about cake'}
    ]

    expect(resolve({id: 1, name: 'Foo'}, items)).to.deep.equal([1])
    expect(resolve({id: 2, name: 'Bar'}, items)).to.deep.equal([2, 3])
    expect(resolve({id: 3, name: 'Some'}, items)).to.deep.equal([4])
    expect(resolve({id: 4, name: 'cake'}, items)).to.deep.equal([5])
    expect(resolve({id: 5, name: 'herp'}, items)).to.deep.equal([])
  })
})
