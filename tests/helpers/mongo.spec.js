/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const mongo = rewire('../../src/helpers/mongo.js')

const loggerMock = {info: sinon.spy(), success: sinon.spy(), error: sinon.spy()}
mongo.__set__('logger', loggerMock)

describe('helpers > mongo', () => {
  before(async () => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
  })

  beforeEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  it('can connect successfully', async () => {
    try {
      await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    } catch (e) {
    }
    expect(loggerMock.info.callCount).to.equal(1)
    expect(loggerMock.error.callCount).to.equal(0)
  })

  it('logs when an error happens connecting', async () => {
    try {
      await mongo.connect('mongodb://127.0.0.1:27014/gw2api-test')
    } catch (e) {
    }
    expect(loggerMock.error.callCount).to.equal(1)
  })

  it('logs when disconnecting', () => {
    let db = mongo.__get__('database')
    db.emit('close')
    expect(loggerMock.error.callCount).to.equal(1)
  })

  it('logs when reconnecting', () => {
    let db = mongo.__get__('database')
    db.emit('reconnect')
    expect(loggerMock.info.callCount).to.equal(1)
  })
})
