/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const Module = rewire('../src/worker.js')

let consoleMock = {
  log: sinon.spy()
}
Module.__set__('console', consoleMock)

describe('abstract worker', function () {
  this.timeout(5000)

  var worker
  var api
  var cache
  beforeEach(() => {
    api = {fiz: 'buz'}
    cache = {foo: 'bar'}
    worker = new Module(api, cache)
    consoleMock.log.reset()
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

    worker.logInfo = sinon.spy()
    worker.logSuccess = sinon.spy()
    worker.logError = sinon.spy()

    await worker.execute(callback)

    // Worker start gets logged
    expect(worker.logInfo.calledOnce).to.equal(true)
    expect(worker.logInfo.args[0][0]).to.contain('AbstractWorker')
    expect(worker.logInfo.args[0][0]).to.contain('callback')

    // Callback gets executed in the correct context
    expect(context).to.be.an.instanceOf(Module)

    // Worker end gets logged correctly
    expect(worker.logSuccess.calledOnce).to.equal(true)
    expect(worker.logSuccess.args[0][0]).to.contain('AbstractWorker')
    expect(worker.logSuccess.args[0][0]).to.contain('callback')
    expect(worker.logError.calledOnce).to.equal(false)

    // Success log includes measured time
    let message = worker.logSuccess.args[0][0]
    let ms = parseInt(/(\d+)ms/.exec(message)[1], 10)
    expect(ms).to.be.above(9)
  })

  it('can execute and log a failed task', async () => {
    let callback = function () {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject({message: 'something went wrong'}), 10)
      })
    }

    worker.logInfo = sinon.spy()
    worker.logSuccess = sinon.spy()
    worker.logError = sinon.spy()

    await worker.execute(callback)

    // Worker end gets logged correctly
    expect(worker.logSuccess.calledOnce).to.equal(false)
    expect(worker.logError.calledOnce).to.equal(true)
    expect(worker.logError.args[0][0]).to.contain('AbstractWorker')
    expect(worker.logError.args[0][0]).to.contain('callback')

    // Error log includes error
    expect(worker.logError.args[0][0]).to.contain('something went wrong')

    // Error log includes measured time
    let message = worker.logError.args[0][0]
    let ms = parseInt(/(\d+)ms/.exec(message)[1], 10)
    expect(ms).to.be.above(9)
  })

  it('logs info messages to console', async () => {
    worker.logInfo('fizbuz')
    expect(consoleMock.log.calledOnce).to.equal(true)
    expect(consoleMock.log.args[0][0]).to.contain('fizbuz')
  })

  it('logs success messages to console', async () => {
    worker.logSuccess('fizbuz')
    expect(consoleMock.log.calledOnce).to.equal(true)
    expect(consoleMock.log.args[0][0]).to.contain('fizbuz')
  })

  it('logs error messages to console', async () => {
    worker.logError('fizbuz')
    expect(consoleMock.log.calledOnce).to.equal(true)
    expect(consoleMock.log.args[0][0]).to.contain('fizbuz')
  })
})
