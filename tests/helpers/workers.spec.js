/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const worker = rewire('../../src/helpers/workers.js')

const loggerMock = {info: sinon.spy(), success: sinon.spy(), error: sinon.spy()}
worker.__set__('logger', loggerMock)

describe('helpers > worker helpers', function () {
  this.timeout(5000)
  beforeEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  it('can schedule a task', async (done) => {
    let execute = worker.__get__('execute')
    let executeMock = sinon.spy()
    worker.__set__('execute', executeMock)
    let callback = 'i should be a callback function'
    let interval = worker.schedule(callback, 0.05)

    setTimeout(() => {
      expect(executeMock.calledTwice).to.equal(true)
      expect(executeMock.args[0][0]).to.equal(callback)
      clearInterval(interval)
      worker.__set__('execute', execute)
      done()
    }, 125)
  })

  it('can execute and log a successful task with passed time', async () => {
    let callback = function () {
      return new Promise(resolve => {
        resolve()
      })
    }

    await worker.execute(callback)

    // Worker start gets logged
    expect(loggerMock.info.calledOnce).to.equal(true)
    expect(loggerMock.info.args[0][0]).to.contain('callback')

    // Worker end gets logged correctly
    expect(loggerMock.success.calledOnce).to.equal(true)
    expect(loggerMock.success.args[0][0]).to.contain('callback')
    expect(loggerMock.error.calledOnce).to.equal(false)

    // Success log includes measured time
    let message = loggerMock.success.args[0][0]
    let ms = parseInt(/(\d+)ms/.exec(message)[1], 10)
    expect(ms).to.be.below(9)
  })

  it('can execute and log a failed task with passed time', async () => {
    let callback = function () {
      return new Promise((resolve, reject) => {
        reject({stack: 'something went wrong'})
      })
    }

    await worker.execute(callback)

    // Worker end gets logged correctly
    expect(loggerMock.success.calledOnce).to.equal(false)
    expect(loggerMock.error.calledOnce).to.equal(true)
    expect(loggerMock.error.args[0][0]).to.contain('callback')

    // Error log includes error
    expect(loggerMock.error.args[0][0]).to.contain('something went wrong')

    // Error log includes measured time
    let message = loggerMock.error.args[0][0]
    let ms = parseInt(/(\d+)ms/.exec(message)[1], 10)
    expect(ms).to.be.below(9)
  })
})
