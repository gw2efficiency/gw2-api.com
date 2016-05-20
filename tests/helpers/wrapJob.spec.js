/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const wrapJob = rewire('../../src/helpers/wrapJob.js')

const consoleMock = {log: sinon.spy(), error: sinon.spy()}
wrapJob.__set__('console', consoleMock)

const jobLogSpy = sinon.spy()
const jobMock = {log: jobLogSpy, data: {title: 'Test job'}}
const doneMock = sinon.spy()

describe('helpers > wrapJob', () => {
  beforeEach(() => {
    consoleMock.log.reset()
    consoleMock.error.reset()
    doneMock.reset()
    // Overwrite the overwritten logging to reset the spy...
    jobLogSpy.reset()
    jobMock.log = jobLogSpy
  })

  it('throws an error in case no callback is provided', () => {
    wrapJob()
    expect(consoleMock.error.called).to.equal(true)
  })

  it('logs start and end of a job', () => {
    let wrappedJob = wrapJob(async (job, done) => {
      done()
    })
    wrappedJob(jobMock, doneMock)

    expect(consoleMock.log.callCount).to.equal(2)
    expect(doneMock.callCount).to.equal(1)
  })

  it('logs job logs to the console and the job and adds timings', () => {
    let wrappedJob = wrapJob(async (job, done) => {
      job.log('Some job log')
      done()
    })
    wrappedJob(jobMock, doneMock)

    expect(consoleMock.log.callCount).to.equal(3)
    expect(jobLogSpy.callCount).to.equal(1)
    expect(doneMock.callCount).to.equal(1)
  })

  it('catches and logs any errors in the job', (done) => {
    let wrappedJob = wrapJob(async (job, done) => {
      throw new Error('Oops.')
    })
    wrappedJob(jobMock, doneMock)

    setTimeout(() => {
      expect(consoleMock.log.callCount).to.equal(2)
      expect(doneMock.callCount).to.equal(1)
      expect(doneMock.args[0][0].message).to.equal('Oops.')
      done()
    }, 25)
  })
})
