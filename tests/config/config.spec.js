/* eslint-env node, mocha */
const expect = require('chai').expect

describe('config files', () => {
  it('has config information about routes', () => {
    let data = require('../../src/config/routes.js')
    expect(data).to.be.an.object
    expect(Object.keys(data).length).to.be.above(0)
  })

  it('has config information about scheduled jobs', () => {
    let data = require('../../src/config/schedule.js')
    expect(data).to.be.an.array
  })
})
