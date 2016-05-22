/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const itemList = rewire('../../../src/jobs/items/itemList.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const jobMock = {log: () => false}
const doneMock = sinon.spy()

// Overwrite the item transformer for easier testing
itemList.__set__('transformItem', x => x)

describe('jobs > items > itemList', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    doneMock.reset()
    done()
  })

  it('loads the items', async () => {
    itemList.__set__('api', () => ({
      language: () => ({
        items: () => ({
          all: () => new Promise(r => r([{id: 1, name: 'Fiz Buz'}]))
        })
      })
    }))

    await itemList(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let items = await mongo.collection('items').find({}, {_id: 0}).sort({lang: 1}).toArray()
    expect(items).to.deep.equal([
      {id: 1, name: 'Fiz Buz', lang: 'de'},
      {id: 1, name: 'Fiz Buz', lang: 'en'},
      {id: 1, name: 'Fiz Buz', lang: 'es'},
      {id: 1, name: 'Fiz Buz', lang: 'fr'}
    ])
  })

  it('doesn\'t overwrite the items', async () => {
    await mongo.collection('items').insertMany([
      {id: 1, name: 'Fiz', lang: 'en', someKey: 'someValue'},
      {id: 2, name: 'Herp', lang: 'en'}
    ])

    itemList.__set__('api', () => ({
      language: () => ({
        items: () => ({
          all: () => new Promise(r => r([
            {id: 1, name: 'Fiz Buz'},
            {id: 2, name: 'Herp', someOtherKey: 'someOtherValue'},
            {id: 3, name: 'Shiny new item'}
          ]))
        })
      })
    }))

    await itemList(jobMock, doneMock)
    expect(doneMock.called).to.equal(true)

    let items = await mongo.collection('items').find({lang: 'en'}, {_id: 0, lang: 0}).sort({id: 1}).toArray()
    expect(items).to.deep.equal([
      {id: 1, name: 'Fiz Buz', someKey: 'someValue'},
      {id: 2, name: 'Herp', someOtherKey: 'someOtherValue'},
      {id: 3, name: 'Shiny new item'}
    ])
  })
})
