/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')

const skinList = rewire('../../../src/jobs/skins/skinList.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('jobs > skins > skinList', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('cache').deleteMany({})
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('loads the skins and resolves into items', async () => {
    await mongo.collection('items').insert([
      {id: 1000, lang: 'en', skins: [1, 4]},
      {id: 2000, lang: 'en', skins: [2]},
      {id: 3000, lang: 'en', skins: [2]},
      {id: 4000, lang: 'en', skins: [3]},
      {id: 5000, lang: 'en', skins: [4]}
    ])

    skinList.__set__('api', () => ({
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

    await skinList()

    let content = (await mongo.collection('cache')
      .find({id: 'skinsToItems'})
      .limit(1).next()).content

    expect(content).to.deep.equal({
      '1': [1000],
      '2': [2000, 3000],
      '3': [4000],
      '4': [1000, 5000],
      '5': []
    })
  })
})
