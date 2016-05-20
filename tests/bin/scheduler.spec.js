/* eslint-env node, mocha */
const expect = require('chai').expect
const proxyquire = require('proxyquire').noCallThru()
const scheduler = proxyquire('../../src/bin/scheduler.js', {
  '../config/jobs.js': [{schedule: '0 0 0 0 10 10', data: {title: 'Test'}}]
})

describe('bin > scheduler', () => {
  it('can run the scheduler server', () => {
    expect(scheduler).to.exist
  })
})
