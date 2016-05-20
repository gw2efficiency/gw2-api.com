/* eslint-env node, mocha */
const expect = require('chai').expect
const scheduler = require('../../src/bin/scheduler.js')

describe('bin > scheduler', () => {
  it('can run the scheduler server', () => {
    expect(scheduler).to.exist
  })
})
