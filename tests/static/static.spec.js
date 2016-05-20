/* eslint-env node, mocha */
const expect = require('chai').expect

describe('static files', () => {
  it('has static information about item categories', () => {
    let data = require('../../src/static/categories.js')
    expect(data).to.be.an.object
    expect(Object.keys(data).length).to.be.above(10)
  })

  it('has static information about legendaries', () => {
    let data = require('../../src/static/legendaries.js')
    expect(data).to.be.an.array
  })

  it('has static information about precursors', () => {
    let data = require('../../src/static/precursors.js')
    expect(data).to.be.an.array
  })

  it('has static information about item rarities', () => {
    let data = require('../../src/static/rarities.js')
    expect(data).to.be.an.object
    expect(Object.keys(data).length).to.equal(8)
  })

  it('has static information blacklisted recipe blacklist', () => {
    let data = require('../../src/static/recipeBlacklist.js')
    expect(data).to.be.an.array
  })

  it('has static information blacklisted tradingpost items', () => {
    let data = require('../../src/static/tradingpostBlacklist.js')
    expect(data).to.be.an.array
  })
})
