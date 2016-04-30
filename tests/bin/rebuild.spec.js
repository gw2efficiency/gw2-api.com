/* eslint-env node, mocha */
const proxyquire = require('proxyquire').noPreserveCache()
const expect = require('chai').expect
const sinon = require('sinon')

const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const loggerMock = {success: sinon.spy(), error: sinon.spy()}
const rebuildSpy = sinon.spy()

describe('bin > rebuild', function () {
  this.timeout(10000)

  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    rebuildSpy.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
    done()
  })

  it('initializes a full rebuild without parameters', (done) => {
    process.argv[2] = undefined
    proxyquire('../../src/bin/rebuild.js', {
      '../helpers/rebuild.js': rebuildSpy,
      '../helpers/logger.js': loggerMock,
      'exit': () => false
    })

    setTimeout(() => {
      expect(rebuildSpy.called).to.equal(true)
      expect(rebuildSpy.args[0][0]).to.equal('full')
      expect(rebuildSpy.args[0][1]).to.be.a.function
      done()
    }, 7100)
  })

  it('initializes a items rebuild', (done) => {
    process.argv[2] = 'items'
    proxyquire('../../src/bin/rebuild.js', {
      '../helpers/rebuild.js': rebuildSpy,
      '../helpers/logger.js': loggerMock,
      'exit': () => false
    })

    setTimeout(() => {
      expect(rebuildSpy.called).to.equal(true)
      expect(rebuildSpy.args[0][0]).to.equal('items')
      expect(rebuildSpy.args[0][1]).to.be.a.function
      done()
    }, 7100)
  })

  it('throws an error if a bad argument is supplied', (done) => {
    process.argv[2] = 'bad'
    proxyquire('../../src/bin/rebuild.js', {
      '../helpers/rebuild.js': rebuildSpy,
      '../helpers/logger.js': loggerMock,
      'exit': () => false
    })

    setTimeout(() => {
      expect(loggerMock.error.called).to.equal(true)
      expect(rebuildSpy.called).to.equal(false)
      done()
    }, 7100)
  })

  it('catches an error if the rebuild function errors out', (done) => {
    process.argv[2] = 'items'
    proxyquire('../../src/bin/rebuild.js', {
      '../helpers/rebuild.js': () => {
        throw new Error('Oops.')
      },
      '../helpers/logger.js': loggerMock,
      'exit': () => false
    })

    setTimeout(() => {
      expect(loggerMock.error.called).to.equal(true)
      done()
    }, 7100)
  })
})
