/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const mergeById = require('../../src/helpers/mergeById.js')

describe('helpers > mergeById', () => {
  it('handles an non-existing array', () => {
    expect(mergeById(
      undefined,
      [{id: 1, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Durr'}]
    )
  })

  it('handles an existing original object', () => {
    expect(mergeById(
      [{id: 1, name: 'Hurr'}],
      [{id: 1, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Durr'}]
    )
  })

  it('adds objects not existing yet', () => {
    expect(mergeById(
      [{id: 1, name: 'Hurr'}],
      [{id: 2, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Hurr'}, {id: 2, name: 'Durr'}]
    )
  })

  it('keeps original properties', () => {
    expect(mergeById(
      [{id: 1, name: 'Hurr', prices: 'something'}],
      [{id: 1, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Durr', prices: 'something'}]
    )
  })

  it('adds new properties', () => {
    expect(mergeById(
      [
        {id: 1, name: 'Hurr', prices: 'something'},
        {id: 2, name: 'Durr', prices: 'something else'}
      ],
      [
        {id: 1, prices: 'something'},
        {id: 2, prices: 'also something'},
        {id: 3, prices: 'and also something'}
      ]
    )).to.deep.equal(
      [
        {id: 1, name: 'Hurr', prices: 'something'},
        {id: 2, name: 'Durr', prices: 'also something'},
        {id: 3, prices: 'and also something'}
      ]
    )
  })

  it('skips non-existing objects if the flag is set', () => {
    expect(mergeById(
      [
        {id: 1, name: 'Hurr', prices: 'something'},
        {id: 2, name: 'Durr', prices: 'something else'}
      ],
      [
        {id: 1, prices: 'something'},
        {id: 2, prices: 'also something'},
        {id: 3, prices: 'and also something'}
      ], true
    )).to.deep.equal(
      [
        {id: 1, name: 'Hurr', prices: 'something'},
        {id: 2, name: 'Durr', prices: 'also something'}
      ]
    )
  })

  it('makes use of a transformer function if it is set', () => {
    expect(mergeById(
      [{id: 1, name: 'Foo'}],
      [{id: 1, name: 'Bar'}],
      false,
      (x, y) => ({name: x.name + y.name})
    )).to.deep.equal(
      [{id: 1, name: 'FooBar'}]
    )
  })
})
