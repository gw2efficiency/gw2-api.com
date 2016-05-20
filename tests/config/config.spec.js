/* eslint-env node, mocha */
const expect = require('chai').expect
const proxyquire = require('proxyquire').noCallThru()

describe('config files', () => {
  it('has config information about routes', () => {
    let data = require('../../src/config/routes.js')
    expect(data).to.be.an.object
    expect(Object.keys(data).length).to.be.above(0)
  })

  it('has config information about jobs', () => {
    let data = require('../../src/config/jobs.js')
    expect(data).to.be.an.array
  })

  it('has config information about the environment', () => {
    let data = require('../../src/config/environment.js')
    expect(data).to.be.an.object
  })

  it('loads config information for the development env', () => {
    let data = require('../../src/config/application.js')
    expect(data).to.be.an.object
  })

  it('loads config information for the production env', () => {
    process.env.NODE_ENV = 'production'

    let data = proxyquire('../../src/config/application.js', {
      '../config/environment.production.js': {production: 'data'}
    })
    expect(data).to.deep.equal({production: 'data'})

    process.env.NODE_ENV = 'testing'
  })
})
