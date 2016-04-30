/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const autocomplete = rewire('../../../src/controllers/items/autocomplete.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('controllers > items > autocomplete', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})

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

    done()
  })

  it('returns the items the query asks for', async () => {
    let response = {send: sinon.spy()}
    await autocomplete({params: {q: 'Foo'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, name: 'Foo', craftable: true},
      {id: 5, name: 'Foo', craftable: true},
      {id: 3, name: 'FooBar', craftable: true},
      {id: 6, name: 'Foo too', craftable: false},
      {id: 8, name: 'Awesome Foo of Herp', craftable: false},
      {id: 4, name: 'Berserkers Foo of Bar', craftable: false},
      {id: 7, name: 'Berserkers Foo', craftable: true}
    ])
  })

  it('doesn\'t return items if the query is too short', async () => {
    let response = {send: sinon.spy()}
    await autocomplete({params: {q: 'F'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([])
  })

  it('only returns craftable items if the parameter is set', async () => {
    let response = {send: sinon.spy()}
    await autocomplete({params: {q: 'Foo', craftable: 1}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal([
      {id: 1, name: 'Foo', craftable: true},
      {id: 5, name: 'Foo', craftable: true},
      {id: 3, name: 'FooBar', craftable: true},
      {id: 7, name: 'Berserkers Foo', craftable: true}
    ])
  })

  it('returns an error if the request has invalid parameters', async () => {
    let response = {send: sinon.spy()}
    await autocomplete({params: {ids: 'autocomplete'}}, response)

    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })

  it('can determine the match quality of an autocomplete query', () => {
    let matchQuality = autocomplete.__get__('matchQuality')
    expect(matchQuality('Foo', 'Foo')).to.equal(0)
    expect(matchQuality('FooBar', 'Foo')).to.equal(1)
    expect(matchQuality('Some Foo required', 'Foo')).to.equal(6)
    expect(matchQuality('Its a Foo', 'Foo')).to.equal(7)
  })
})
