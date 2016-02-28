/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const storage = rewire('../../src/helpers/sharedStorage.js')
const EventEmitter = require('events').EventEmitter

const loggerMock = {success: sinon.spy(), info: sinon.spy(), error: sinon.spy()}
storage.__set__('logger', loggerMock)

const redisMock = {get: sinon.spy(), set: sinon.spy()}

describe('helpers > shared storage', () => {
  afterEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
    storage.__set__('state', {})
    storage.__set__('redis', redisMock)
  })

  it('shows the error if redis errors out', done => {
    let redis = new EventEmitter()
    storage.__set__('redis', redis)

    redis.on('error', storage.__get__('onError'))
    redis.emit('error', {message: 'Oh no.'})

    setTimeout(() => {
      expect(loggerMock.error.callCount).to.be.above(0)
      done()
    }, 10)
  })

  it('loads the storage from redis', () => {
    redisMock.get = (k, c) => c(null, JSON.stringify({key: 123}))

    storage.load()
    expect(storage.get('key')).to.equal(123)
    expect(loggerMock.info.calledOnce).to.be.true
  })

  it('cancels if the storage is non existent', () => {
    redisMock.get = (k, c) => c(null, null)

    storage.load()
    expect(storage.get('key')).to.equal(undefined)
    expect(loggerMock.info.calledOnce).to.be.true
  })

  it('cancels if the redis operation failed', () => {
    redisMock.get = (k, c) => c('some error', null)

    storage.load()
    expect(storage.get('key')).to.equal(undefined)
    expect(loggerMock.error.calledOnce).to.be.true
  })

  it('cancels if the json decoding failed', () => {
    redisMock.get = (k, c) => c(null, 'lol')

    storage.load()
    expect(storage.get('key')).to.equal(undefined)
    expect(loggerMock.error.calledOnce).to.be.true
  })

  it('saves the storage into redis', () => {
    redisMock.set = sinon.stub().callsArg(2)

    storage.set('mykey', 42)

    storage.save()
    expect(redisMock.set.args[0][1]).to.equal(JSON.stringify({mykey: 42}))
    expect(loggerMock.info.calledOnce).to.be.true
  })

  it('can set and get a storage key', () => {
    storage.set('foo', {bar: 1337})
    expect(storage.get('foo')).to.deep.equal({bar: 1337})
    expect(storage.get('nofoo', 123)).to.deep.equal(123)
  })
})
