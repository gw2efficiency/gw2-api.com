/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const Module = rewire('../src/worker.js')

const loggerMock = {info: sinon.spy(), success: sinon.spy(), error: sinon.spy()}
Module.__set__('logger', loggerMock)

describe('abstract worker', function () {
  this.timeout(5000)

  let worker
  let api
  let cache
  beforeEach(() => {
    api = {fiz: 'buz'}
    cache = {foo: 'bar'}
    worker = new Module(api, cache)
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  it('initializes with the api and cache object', async () => {
    expect(worker.api).to.deep.equal({fiz: 'buz'})
    expect(worker.cache).to.deep.equal({foo: 'bar'})
  })

  it('can schedule a task', async (done) => {
    worker.execute = sinon.spy()
    let callback = 'i should be a callback function'
    let interval = worker.schedule(callback, 0.05)

    setTimeout(() => {
      expect(worker.execute.calledTwice).to.equal(true)
      expect(worker.execute.args[0][0]).to.equal(callback)
      clearInterval(interval)
      done()
    }, 125)
  })

  it('can execute and log a successful task', async () => {
    let context
    let callback = function () {
      context = this
      return new Promise(resolve => {
        setTimeout(resolve, 10)
      })
    }

    await worker.execute(callback)

    // Worker start gets logged
    expect(loggerMock.info.calledOnce).to.equal(true)
    expect(loggerMock.info.args[0][0]).to.contain('AbstractWorker')
    expect(loggerMock.info.args[0][0]).to.contain('callback')

    // Callback gets executed in the correct context
    expect(context).to.be.an.instanceOf(Module)

    // Worker end gets logged correctly
    expect(loggerMock.success.calledOnce).to.equal(true)
    expect(loggerMock.success.args[0][0]).to.contain('AbstractWorker')
    expect(loggerMock.success.args[0][0]).to.contain('callback')
    expect(loggerMock.error.calledOnce).to.equal(false)

    // Success log includes measured time
    let message = loggerMock.success.args[0][0]
    let ms = parseInt(/(\d+)ms/.exec(message)[1], 10)
    expect(ms).to.be.above(9)
  })

  it('can execute and log a failed task', async () => {
    let callback = function () {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject({stack: 'something went wrong'}), 10)
      })
    }

    await worker.execute(callback)

    // Worker end gets logged correctly
    expect(loggerMock.success.calledOnce).to.equal(false)
    expect(loggerMock.error.calledOnce).to.equal(true)
    expect(loggerMock.error.args[0][0]).to.contain('AbstractWorker')
    expect(loggerMock.error.args[0][0]).to.contain('callback')

    // Error log includes error
    expect(loggerMock.error.args[0][0]).to.contain('something went wrong')

    // Error log includes measured time
    let message = loggerMock.error.args[0][0]
    let ms = parseInt(/(\d+)ms/.exec(message)[1], 10)
    expect(ms).to.be.above(9)
  })
})
