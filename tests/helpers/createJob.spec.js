/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const kue = require('../../src/helpers/kue.js')
const queue = kue.createQueue()

const createJob = rewire('../../src/helpers/createJob.js')

const getJobs = function (type, state, cb) {
  kue.Job.rangeByType(type, state, 0, -1, 'asc', cb)
}

const consoleMock = {log: sinon.spy(), error: sinon.spy()}
createJob.__set__('console', consoleMock)

describe('helpers > createJob', function () {
  this.timeout(5000)

  beforeEach((done) => {
    consoleMock.log.reset()
    consoleMock.error.reset()

    queue.client.flushdb(done)
  })

  it('instantly queues a job', (done) => {
    createJob({
      name: 'test',
      data: {title: 'asd'}
    })

    getJobs('test', 'inactive', (err, jobs) => {
      expect(err).to.equal(null)
      expect(consoleMock.log.callCount).to.equal(1)
      expect(jobs.length).to.equal(1)
      done()
    })
  })

  it('schedules queues a job', (done) => {
    createJob({
      name: 'test',
      data: {title: 'asd'},
      schedule: '* * * * * *'
    })

    setTimeout(() => {
      getJobs('test', 'inactive', (err, jobs) => {
        expect(err).to.equal(null)
        expect(consoleMock.log.callCount).to.equal(4)
        expect(jobs.length).to.equal(3)
        done()
      })
    }, 3500)
  })
})
