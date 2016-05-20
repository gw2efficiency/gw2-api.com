/* eslint-env node, mocha */
const expect = require('chai').expect
const proxyquire = require('proxyquire').noCallThru()
const scheduler = proxyquire('../../src/bin/scheduler.js', {
  '../config/jobs.js': []
})

describe('bin > scheduler', () => {
  it('can run the scheduler server', () => {
    expect(scheduler).to.exist
  })
})
