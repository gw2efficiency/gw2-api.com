/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const controller = rewire('../../src/controllers/item.js')
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > item', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('handles /item/:id', async () => {
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en'},
      {id: 2, name: 'Bar', lang: 'en'},
      {id: 3, name: 'FooBar', lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await controller.byId({params: {id: 2}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal({id: 2, name: 'Bar'})
  })

  it('handles /item/:id with missing item', async () => {
    let response = {send: sinon.spy()}
    await controller.byId({params: {id: 999}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(404)
    expect(response.send.args[0][1]).to.deep.equal({text: 'no such id'})
  })

  it('handles /item/:id with missing parameters', async () => {
    let response = {send: sinon.spy()}
    await controller.byId({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('handles /items/:ids', async () => {
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en'},
      {id: 2, name: 'Bar', lang: 'en'},
      {id: 3, name: 'FooBar', lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await controller.byIds({params: {ids: '2,3'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 2, name: 'Bar'},
      {id: 3, name: 'FooBar'}
    ])
  })

  it('handles /items/all', async () => {
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en'},
      {id: 2, name: 'Bar', lang: 'en', tradable: true},
      {id: 3, name: 'FooBar', lang: 'en', tradable: true},
      {id: 4, name: 'Herp', lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await controller.all({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 2, name: 'Bar', tradable: true},
      {id: 3, name: 'FooBar', tradable: true}
    ])
  })

  it('handles /items/all-prices', async () => {
    await mongo.collection('items').insert([
      {id: 1, lang: 'en', tradable: true, buy: {price: 0}, sell: {price: 123}},
      {id: 2, lang: 'en', tradable: true, buy: {price: 456}, sell: {price: 0}},
      {id: 3, lang: 'en', tradable: true},
      {id: 4, lang: 'en', tradable: true, vendor_price: 910}
    ])

    let response = {send: sinon.spy()}
    await controller.allPrices({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, price: 123},
      {id: 2, price: 456},
      {id: 4, price: 910}
    ])
  })

  it('handles /items/categories', async () => {
    let response = {send: sinon.spy()}
    await controller.categories({params: {}}, response)

    expect(response.send.calledOnce).to.equal(true)
    let categories = response.send.args[0][0]
    expect(categories).to.be.an.object
    expect(Object.keys(categories).length).to.be.above(10)
  })

  it('handles /items/autocomplete', async () => {
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en'},
      {id: 2, name: 'Bar', lang: 'en'},
      {id: 3, name: 'FooBar', lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await controller.autocomplete({params: {ids: 'autocomplete', q: 'Foo'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, name: 'Foo'},
      {id: 3, name: 'FooBar'}
    ])
  })

  it('handles /items/autocomplete with missing parameters', async () => {
    let response = {send: sinon.spy()}
    await controller.autocomplete({params: {ids: 'autocomplete'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('can determine the match quality of an autocomplete query', () => {
    let matchQuality = controller.__get__('matchQuality')
    expect(matchQuality('Foo', 'Foo')).to.equal(0)
    expect(matchQuality('FooBar', 'Foo')).to.equal(1)
    expect(matchQuality('Some Foo required', 'Foo')).to.equal(6)
    expect(matchQuality('Its a Foo', 'Foo')).to.equal(7)
  })

  it('supports all the item autocomplete parameters', async () => {
    let response = {send: sinon.spy()}
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en', craftable: true},
      {id: 2, name: 'Bar', lang: 'en', craftable: false},
      {id: 3, name: 'FooBar', lang: 'en', craftable: true},
      {id: 4, name: 'Berserkers Foo of Bar', lang: 'en', craftable: false},
      {id: 5, name: 'Foo', lang: 'en', craftable: true},
      {id: 6, name: 'Foo too', lang: 'en', craftable: false},
      {id: 7, name: 'Berserkers Foo', lang: 'en', craftable: true},
      {id: 8, name: 'Awesome Foo of Herp', lang: 'en', craftable: false}
    ])

    await controller.autocomplete({params: {q: 'F'}}, response)
    expect(response.send.args[0][0]).to.deep.equal([])

    await controller.autocomplete({params: {q: 'Foo'}}, response)
    expect(response.send.args[1][0]).to.deep.equal([
      {id: 1, name: 'Foo', craftable: true},
      {id: 5, name: 'Foo', craftable: true},
      {id: 3, name: 'FooBar', craftable: true},
      {id: 6, name: 'Foo too', craftable: false},
      {id: 8, name: 'Awesome Foo of Herp', craftable: false},
      {id: 4, name: 'Berserkers Foo of Bar', craftable: false},
      {id: 7, name: 'Berserkers Foo', craftable: true}
    ])

    await controller.autocomplete({params: {q: 'Foo', craftable: 1}}, response)
    expect(response.send.args[2][0]).to.deep.equal([
      {id: 1, name: 'Foo', craftable: true},
      {id: 5, name: 'Foo', craftable: true},
      {id: 3, name: 'FooBar', craftable: true},
      {id: 7, name: 'Berserkers Foo', craftable: true}
    ])
  })

  it('handles /items/by-name', async () => {
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en', tradable: false},
      {id: 2, name: 'Bar', lang: 'en', tradable: true},
      {id: 3, name: 'FooBar', lang: 'en', tradable: true}
    ])

    let response = {send: sinon.spy()}
    await controller.byName({params: {ids: 'by-name', names: 'Foo,bAr'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, name: 'Foo', tradable: false}
    ])
  })

  it('handles /items/by-name with missing parameters', async () => {
    let response = {send: sinon.spy()}
    await controller.byName({params: {ids: 'by-name'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('handles /items/by-skin', async () => {
    await mongo.collection('items').insert([
      {id: 1, skins: [42], lang: 'en'},
      {id: 2, lang: 'en'},
      {id: 3, skins: [123], lang: 'en'},
      {id: 4, skins: [42], lang: 'en'}
    ])

    let response = {send: sinon.spy()}
    await controller.bySkin({params: {ids: 'by-skin', skin_id: '42'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([1, 4])
  })

  it('handles /items/by-skin with missing parameters', async () => {
    let response = {send: sinon.spy()}
    await controller.bySkin({params: {ids: 'by-skin'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('handles /items/query', async () => {
    let response = {send: sinon.spy()}
    await mongo.collection('items').insert([
      {id: 1, name: 'Foo', lang: 'en', rarity: 0, category: [14, 2], buy: {price: 0}, sell: {price: 123}},
      {id: 2, name: 'Bar', lang: 'en', rarity: 1, category: [2], buy: {price: 123}, sell: {price: 456}},
      {id: 3, name: 'FooBar', lang: 'en', rarity: 2, craftable: true},
      {id: 4, name: 'Herp', lang: 'en', rarity: 4, category: [14, 6], buy: {price: 789}, sell: {price: 1011}},
      {id: 5, name: 'Hurp', lang: 'en', rarity: 4, category: [14, 3]}
    ])

    await controller.query({params: {ids: 'query'}}, response)
    expect(response.send.args[0][0]).to.deep.equal([1, 2, 3, 4, 5])

    await controller.query({params: {ids: 'query', rarities: '1;2'}}, response)
    expect(response.send.args[1][0]).to.deep.equal([2, 3])

    await controller.query({params: {ids: 'query', craftable: '14'}}, response)
    expect(response.send.args[2][0]).to.deep.equal([3])

    await controller.query({params: {ids: 'query', exclude_name: 'Foo'}}, response)
    expect(response.send.args[3][0]).to.deep.equal([2, 4, 5])

    await controller.query({params: {ids: 'query', include_name: 'Foo'}}, response)
    expect(response.send.args[4][0]).to.deep.equal([1, 3])

    await controller.query({params: {ids: 'query', categories: '14'}}, response)
    expect(response.send.args[5][0]).to.deep.equal([1, 4, 5])

    await controller.query({params: {ids: 'query', categories: '14,2'}}, response)
    expect(response.send.args[6][0]).to.deep.equal([1])

    await controller.query({params: {ids: 'query', categories: '14,2;14,3'}}, response)
    expect(response.send.args[7][0]).to.deep.equal([1, 5])

    await controller.query({params: {ids: 'query', categories: '14;2'}}, response)
    expect(response.send.args[8][0]).to.deep.equal([1, 2, 4, 5])

    await controller.query({params: {ids: 'query', categories: '14,2;2'}}, response)
    expect(response.send.args[9][0]).to.deep.equal([1, 2])

    await controller.query({params: {ids: 'query', output: 'prices'}}, response)
    expect(response.send.args[10][0]).to.deep.equal({
      buy: {min: 0, avg: 304, max: 789},
      sell: {min: 123, avg: 530, max: 1011}
    })
  })
})
