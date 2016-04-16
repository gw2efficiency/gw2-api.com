/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const worker = rewire('../../src/workers/skin.js')
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const executeMock = sinon.spy()
worker.__set__('execute', executeMock)

const scheduleMock = sinon.spy()
worker.__set__('schedule', scheduleMock)

describe('workers > skin worker', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('cache').deleteMany({})
    await mongo.collection('items').deleteMany({})
    executeMock.reset()
    scheduleMock.reset()
    done()
  })

  it('initializes correctly without data', async () => {
    await mongo.collection('items').insert({id: 1, hint: 'placeholder item'})
    await worker.initialize()

    expect(executeMock.callCount).to.equal(2)
    expect(executeMock.args[0][0].name).to.equal('loadSkinList')
    expect(executeMock.args[1][0].name).to.equal('loadSkinPrices')

    expect(scheduleMock.callCount).to.equal(2)
    expect(scheduleMock.args[0][1].name).to.equal('loadSkinList')
    expect(scheduleMock.args[1][1].name).to.equal('loadSkinPrices')
  })

  it('initializes correctly with data', async () => {
    await mongo.collection('items').insert({id: 1, hint: 'placeholder item'})
    await mongo.collection('cache').insert({id: 'skinsToItems', content: 'i am some content'})
    await worker.initialize()

    expect(executeMock.callCount).to.equal(0)

    expect(scheduleMock.callCount).to.equal(2)
    expect(scheduleMock.args[0][1].name).to.equal('loadSkinList')
    expect(scheduleMock.args[1][1].name).to.equal('loadSkinPrices')
  })

  it('loads the skins and resolves into items', async () => {
    await mongo.collection('items').insert([
      {id: 1000, lang: 'en', skins: [1, 4]},
      {id: 2000, lang: 'en', skins: [2]},
      {id: 3000, lang: 'en', skins: [2]},
      {id: 4000, lang: 'en', skins: [3]},
      {id: 5000, lang: 'en', skins: [4]}
    ])

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

    let content = (await mongo.collection('cache').find({id: 'skinsToItems'}).limit(1).next()).content
    expect(content).to.deep.equal({
      '1': [1000],
      '2': [2000, 3000],
      '3': [4000],
      '4': [1000, 5000],
      '5': []
    })
  })

  it('calculates the skin prices correctly', async () => {
    await mongo.collection('items').insert([
      {id: 1, tradable: true, lang: 'en', value: 123, valueIsVendor: false},
      {id: 2, tradable: true, lang: 'en', value: 456, valueIsVendor: false},
      {id: 3, tradable: true, lang: 'en', value: 789, valueIsVendor: true},
      {id: 4, tradable: true, lang: 'en'},
      {id: 5, tradable: true, lang: 'en', value: 999, valueIsVendor: false},
      {id: 6, tradable: true, lang: 'en', value: 500, valueIsVendor: false}
    ])
    await mongo.collection('cache').insert({
      id: 'skinsToItems',
      content: {
        71: [1],
        72: [2],
        73: [3],
        74: [4],
        75: [1, 2, 3, 4],
        76: [5, 2],
        77: [20319],
        78: [5, 1337],
        79: [3, 5, 6]
      }
    })

    await worker.loadSkinPrices()

    let skinPrices = (await mongo.collection('cache').find({id: 'skinPrices'}).limit(1).next()).content
    expect(skinPrices).to.deep.equal({
      71: 123,
      72: 456,
      75: 123,
      76: 456,
      78: 999,
      79: 500
    })
  })
})
