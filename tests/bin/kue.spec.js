/* eslint-env node, mocha */
const expect = require('chai').expect
const kue = require('../../src/bin/kue.js')

describe('bin > kue', () => {
  it('can run the kue server', () => {
    expect(kue).to.exist
  })
})
