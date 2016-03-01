/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const worker = rewire('../../src/workers/skin.js')

const loggerMock = {info: sinon.spy()}
worker.__set__('logger', loggerMock)

const executeMock = sinon.spy()
worker.__set__('execute', executeMock)

const scheduleMock = sinon.spy()
worker.__set__('schedule', scheduleMock)

let storage = worker.__get__('storage')
storage.save = () => true

describe('workers > skin worker', () => {
  beforeEach(() => {
    loggerMock.info.reset()
    executeMock.reset()
    scheduleMock.reset()
    storage.set('gemPriceHistory')
  })

  it('initializes correctly without data', async () => {
    worker.__set__('storage', {
      set: () => true,
      get: (key) => (key === 'items') ? '...' : undefined
    })
    await worker.initialize()

    expect(executeMock.calledOnce).to.equal(true)
    expect(executeMock.args[0][0].name).to.equal('loadSkinList')
    expect(scheduleMock.calledOnce).to.equal(true)
    expect(scheduleMock.args[0][0].name).to.equal('loadSkinList')
    expect(scheduleMock.args[0][1]).to.be.an.integer
    expect(loggerMock.info.calledOnce).to.equal(true)
    worker.__set__('storage', storage)
  })

  it('initializes correctly with data', async () => {
    worker.__set__('storage', {
      set: () => true,
      get: () => 'we have data!'
    })
    await worker.initialize()

    expect(executeMock.callCount).to.equal(0)
    expect(scheduleMock.calledOnce).to.equal(true)
    expect(scheduleMock.args[0][0].name).to.equal('loadSkinList')
    expect(scheduleMock.args[0][1]).to.be.an.integer
    expect(loggerMock.info.calledOnce).to.equal(true)
    worker.__set__('storage', storage)
  })

  it('loads the skins and resolves into items', async () => {
    storage.set('items', {
      en: [
        {id: 1, name: 'Foo', skin: 1},
        {id: 2, name: 'Bar'},
        {id: 3, name: 'Bar'},
        {id: 4, name: 'Some Skin'},
        {id: 5, name: 'Something about cake'}
      ]
    })

    worker.__set__('api', () => ({
      skins: () => ({
        all: () => [
          {id: 1, name: 'Foo'},
          {id: 2, name: 'Bar'},
          {id: 3, name: 'Some'},
          {id: 4, name: 'cake'},
          {id: 5, name: 'herp'}
        ]
      })
    }))

    await worker.loadSkinList()
    expect(storage.get('skinsToItems')).to.deep.equal({
      '1': [1],
      '2': [2, 3],
      '3': [4],
      '4': [5],
      '5': []
    })

    expect(loggerMock.info.calledOnce).to.equal(true)
  })

  it('resolves skins correctly', () => {
    let resolve = worker.__get__('resolveSkin')
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
