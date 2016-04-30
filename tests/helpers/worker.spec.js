/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const worker = rewire('../../src/helpers/worker.js')

const loggerMock = {info: sinon.spy(), success: sinon.spy(), error: sinon.spy()}
const schedulerMock = {scheduleJob: sinon.spy()}
worker.__set__('logger', loggerMock)
worker.__set__('scheduler', schedulerMock)

describe('helpers > worker', function () {
  beforeEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  it('can schedule a task', async () => {
    let tmp = worker.__get__('execute')
    let executeMock = sinon.spy()
    worker.__set__('execute', executeMock)

    let callback = 'i should be a callback function'
    worker('* * * * * *', callback)

    // Check if the scheduler got called
    expect(schedulerMock.scheduleJob.called).to.equal(true)
    expect(schedulerMock.scheduleJob.args[0][0]).to.equal('* * * * * *')

    // Check if the wrapped callback is correct
    schedulerMock.scheduleJob.args[0][1]()
    expect(executeMock.called).to.equal(true)
    expect(executeMock.args[0][0]).to.equal(callback)

    worker.__set__('execute', tmp)
  })

  it('can execute and log a successful task with passed time', async () => {
    let callback = function () {
      return new Promise(resolve => {
        resolve()
      })
    }

    await worker.__get__('execute')(callback)

    // Worker start gets logged
    expect(loggerMock.info.calledOnce).to.equal(true)
    expect(loggerMock.info.args[0][0]).to.contain('callback')

    // Worker end gets logged correctly
    expect(loggerMock.success.calledOnce).to.equal(true)
    expect(loggerMock.success.args[0][0]).to.contain('callback')
    expect(loggerMock.error.calledOnce).to.equal(false)

    // Success log includes measured time
    let message = loggerMock.success.args[0][0]
    let seconds = parseInt(/(\d+)s/.exec(message)[1], 10)
    expect(seconds).to.equal(0)
  })

  it('can execute and log a failed task with passed time', async () => {
    let callback = function () {
      return new Promise((resolve, reject) => {
        reject({stack: 'something went wrong'})
      })
    }

    await worker.__get__('execute')(callback)

    // Worker end gets logged correctly
    expect(loggerMock.success.calledOnce).to.equal(false)
    expect(loggerMock.error.calledOnce).to.equal(true)
    expect(loggerMock.error.args[0][0]).to.contain('callback')

    // Error log includes error
    expect(loggerMock.error.args[0][0]).to.contain('something went wrong')

    // Error log includes measured time
    let message = loggerMock.error.args[0][0]
    let seconds = parseInt(/(\d+)s/.exec(message)[1], 10)
    expect(seconds).to.equal(0)
  })
})
