/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const controller = rewire('../../src/controllers/item.js')

let storage = controller.__get__('storage')

describe('controllers > item', () => {
  beforeEach(() => {
    storage.set('items', [])
  })

  it('handles /item/:id', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, name_en: 'Foo', description_en: null, tradable: false},
      {id: 2, name_en: 'Bar', description_en: null, tradable: true},
      {id: 3, name_en: 'FooBar', description_en: null, tradable: true}
    ]
    storage.set('items', items)

    controller.byId({params: {id: 2}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(
      {id: 2, name: 'Bar', description: null, tradable: true}
    )
  })

  it('handles /item/:id with missing parameters', () => {
    let response = {send: sinon.spy()}

    controller.byId({params: {}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('handles /items/:ids', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, name_en: 'Foo', description_en: null, tradable: false},
      {id: 2, name_en: 'Bar', description_en: null, tradable: true},
      {id: 3, name_en: 'FooBar', description_en: null, tradable: true}
    ]
    storage.set('items', items)

    controller.byIds({params: {ids: '2,3'}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 2, name: 'Bar', description: null, tradable: true},
      {id: 3, name: 'FooBar', description: null, tradable: true}
    ])
  })

  it('handles /items/all', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, name_en: 'Foo', description_en: null, tradable: false},
      {id: 2, name_en: 'Bar', description_en: null, tradable: true},
      {id: 3, name_en: 'FooBar', description_en: null, tradable: true},
      {id: 4, name_en: 'Herp', description_en: null, tradable: false}
    ]
    storage.set('items', items)

    controller.all({params: {}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 2, name: 'Bar', description: null, tradable: true},
      {id: 3, name: 'FooBar', description: null, tradable: true}
    ])
  })

  it('handles /items/all-prices', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, buy: {price: 0}, sell: {price: 123}},
      {id: 2, buy: {price: 456}, sell: {price: 0}},
      {id: 3},
      {id: 4, buy: {price: 678}, sell: {price: 910}}
    ]
    storage.set('items', items)

    controller.allPrices({params: {}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, price: 123},
      {id: 2, price: 456},
      {id: 4, price: 910}
    ])
  })

  it('handles /items/categories', () => {
    let response = {send: sinon.spy()}

    controller.categories({params: {}}, response)
    expect(response.send.calledOnce).to.equal(true)

    let categories = response.send.args[0][0]
    expect(categories).to.be.an.object
    expect(Object.keys(categories).length).to.be.above(10)
  })

  it('handles /items/autocomplete', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, name_en: 'Foo', description_en: null, tradable: false},
      {id: 2, name_en: 'Bar', description_en: null, tradable: true},
      {id: 3, name_en: 'FooBar', description_en: null, tradable: true}
    ]
    storage.set('items', items)

    controller.autocomplete({params: {ids: 'autocomplete', q: 'Foo'}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, name: 'Foo', description: null, tradable: false},
      {id: 3, name: 'FooBar', description: null, tradable: true}
    ])
  })

  it('handles /items/autocomplete with missing parameters', () => {
    let response = {send: sinon.spy()}

    controller.autocomplete({params: {ids: 'autocomplete'}}, response)
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

  it('supports get all the item autocomplete parameters', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, name_en: 'Foo', description_en: null, craftable: true},
      {id: 2, name_en: 'Bar', description_en: null, craftable: false},
      {id: 3, name_en: 'FooBar', description_en: null, craftable: true},
      {id: 4, name_en: 'Berserkers Foo of Bar', description_en: null, craftable: false},
      {id: 5, name_en: 'Foo', description_en: null, craftable: true},
      {id: 6, name_en: 'Foo too', description_en: null, craftable: false},
      {id: 7, name_en: 'Berserkers Foo', description_en: null, craftable: true},
      {id: 8, name_en: 'Awesome Foo of Herp', description_en: null, craftable: false}
    ]
    storage.set('items', items)

    controller.autocomplete({params: {q: 'F'}}, response)
    expect(response.send.args[0][0]).to.deep.equal([])

    controller.autocomplete({params: {q: 'Foo'}}, response)
    expect(response.send.args[1][0]).to.deep.equal([
      {id: 1, name: 'Foo', description: null, craftable: true},
      {id: 5, name: 'Foo', description: null, craftable: true},
      {id: 3, name: 'FooBar', description: null, craftable: true},
      {id: 6, name: 'Foo too', description: null, craftable: false},
      {id: 8, name: 'Awesome Foo of Herp', description: null, craftable: false},
      {id: 4, name: 'Berserkers Foo of Bar', description: null, craftable: false},
      {id: 7, name: 'Berserkers Foo', description: null, craftable: true}
    ])

    controller.autocomplete({params: {q: 'Foo', craftable: 1}}, response)
    expect(response.send.args[2][0]).to.deep.equal([
      {id: 1, name: 'Foo', description: null, craftable: true},
      {id: 5, name: 'Foo', description: null, craftable: true},
      {id: 3, name: 'FooBar', description: null, craftable: true},
      {id: 7, name: 'Berserkers Foo', description: null, craftable: true}
    ])
  })

  it('handles /items/by-name', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, name_en: 'Foo', description_en: null, tradable: false},
      {id: 2, name_en: 'Bar', description_en: null, tradable: true},
      {id: 3, name_en: 'FooBar', description_en: null, tradable: true}
    ]
    storage.set('items', items)

    controller.byName({params: {ids: 'by-name', names: 'Foo,bAr'}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, name: 'Foo', description: null, tradable: false},
      {id: 2, name: 'Bar', description: null, tradable: true}
    ])
  })

  it('handles /items/by-name with missing parameters', () => {
    let response = {send: sinon.spy()}

    controller.byName({params: {ids: 'by-name'}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('handles /items/by-skin', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, skin: 42},
      {id: 2},
      {id: 3, skin: 123},
      {id: 4, skin: 42}
    ]
    storage.set('items', items)

    controller.bySkin({params: {ids: 'by-skin', skin_id: '42'}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([1, 4])
  })

  it('handles /items/by-skin with missing parameters', () => {
    let response = {send: sinon.spy()}

    controller.bySkin({params: {ids: 'by-skin'}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('handles /items/query', () => {
    let response = {send: sinon.spy()}
    let items = [
      {id: 1, name_en: 'Foo', rarity: 0, category: [1, 2], buy: {price: 0}, sell: {price: 123}},
      {id: 2, name_en: 'Bar', rarity: 1, category: [2], buy: {price: 123}, sell: {price: 456}},
      {id: 3, name_en: 'FooBar', rarity: 2, craftable: true},
      {id: 4, name_en: 'Herp', rarity: 4, category: [1], buy: {price: 789}, sell: {price: 1011}},
      {id: 5, name_en: 'Hurp', rarity: 4, category: [1, 3]}
    ]
    storage.set('items', items)

    controller.query({params: {ids: 'query'}}, response)
    expect(response.send.args[0][0]).to.deep.equal([1, 2, 3, 4, 5])

    controller.query({params: {ids: 'query', rarities: '1;2'}}, response)
    expect(response.send.args[1][0]).to.deep.equal([2, 3])

    controller.query({params: {ids: 'query', craftable: '1'}}, response)
    expect(response.send.args[2][0]).to.deep.equal([3])

    controller.query({params: {ids: 'query', exclude_name: 'Foo'}}, response)
    expect(response.send.args[3][0]).to.deep.equal([2, 4, 5])

    controller.query({params: {ids: 'query', include_name: 'Foo'}}, response)
    expect(response.send.args[4][0]).to.deep.equal([1, 3])

    controller.query({params: {ids: 'query', categories: '1'}}, response)
    expect(response.send.args[5][0]).to.deep.equal([1, 4, 5])

    controller.query({params: {ids: 'query', categories: '1,2'}}, response)
    expect(response.send.args[6][0]).to.deep.equal([1])

    controller.query({params: {ids: 'query', categories: '1,2;1,3'}}, response)
    expect(response.send.args[7][0]).to.deep.equal([1, 5])

    controller.query({params: {ids: 'query', categories: '1;2'}}, response)
    expect(response.send.args[8][0]).to.deep.equal([1, 2, 4, 5])

    controller.query({params: {ids: 'query', categories: '1,2;2'}}, response)
    expect(response.send.args[9][0]).to.deep.equal([1, 2])

    controller.query({params: {ids: 'query', output: 'prices'}}, response)
    expect(response.send.args[10][0]).to.deep.equal({
      buy: {min: 0, avg: 304, max: 789},
      sell: {min: 123, avg: 530, max: 1011}
    })
  })
})
