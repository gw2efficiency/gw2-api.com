/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')
const Module = rewire('../src/controller.js')

describe('abstract controller', () => {
  var controller
  var cache
  beforeEach(() => {
    cache = {foo: 'bar'}
    controller = new Module(cache)
  })

  it('initializes with the cache object', async () => {
    expect(controller.cache).to.deep.equal({foo: 'bar'})
  })
})
