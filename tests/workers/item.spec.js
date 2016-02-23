/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const mockdate = require('mockdate')
const api = new (require('gw2api-client'))()
const Module = rewire('../../src/workers/item.js')

const loggerMock = {success: sinon.spy()}
Module.__set__('logger', loggerMock)

describe('workers > item', () => {
  let worker
  let cache
  beforeEach(() => {
    cache = {}
    worker = new Module(api, cache)
  })

  it('merges correctly', () => {
    let mergeById = Module.__get__('mergeById')

    expect(mergeById(
      undefined,
      [{id: 1, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Durr'}]
    )

    expect(mergeById(
      [{id: 1, name: 'Hurr'}],
      [{id: 1, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Durr'}]
    )

    expect(mergeById(
      [{id: 1, name: 'Hurr'}],
      [{id: 2, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Hurr'}, {id: 2, name: 'Durr'}]
    )

    expect(mergeById(
      [{id: 1, name: 'Hurr', prices: 'something'}],
      [{id: 1, name: 'Durr'}]
    )).to.deep.equal(
      [{id: 1, name: 'Durr', prices: 'something'}]
    )

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

    expect(mergeById(
      [{id: 1, name: 'Foo'}],
      [{id: 1, name: 'Bar'}],
      false,
      (x, y) => ({name: x.name + y.name})
    )).to.deep.equal(
      [{id: 1, name: 'FooBar'}]
    )
  })

  it('initializes correctly', async () => {
    worker.execute = sinon.spy()
    worker.schedule = sinon.spy()

    await worker.initialize()

    expect(worker.execute.calledTwice).to.equal(true)
    expect(worker.execute.args[0][0].name).to.equal('loadItems')
    expect(worker.execute.args[1][0].name).to.equal('loadItemPrices')

    expect(worker.schedule.calledTwice).to.equal(true)
    expect(worker.schedule.args[0][0].name).to.equal('loadItems')
    expect(worker.schedule.args[0][1]).to.be.an.integer
    expect(worker.schedule.args[1][0].name).to.equal('loadItemPrices')
    expect(worker.schedule.args[1][1]).to.be.an.integer

    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('loads the items', async () => {
    let transformer = Module.__get__('transformItem')
    Module.__set__('transformItem', x => x.name)
    worker.api = () => ({
      language: () => ({
        items: () => ({
          all: () => [{id: 1, name: 'Fiz Buz'}]
        })
      })
    })

    await worker.loadItems()
    expect(cache.items).to.deep.equal({
      de: ['Fiz Buz'],
      en: ['Fiz Buz'],
      fr: ['Fiz Buz'],
      es: ['Fiz Buz']
    })

    Module.__set__('transformItem', transformer)
  })

  it('doesn\'t overwrite the items', async () => {
    let transformer = Module.__get__('transformItem')
    Module.__set__('transformItem', x => x)

    cache.items = {
      en: [
        {id: 1, name: 'Fiz', someKey: 'someValue'},
        {id: 2, name: 'Herp'}
      ]
    }

    worker.api = () => ({
      language: () => ({
        items: () => ({
          all: () => [
            {id: 1, name: 'Fiz Buz'},
            {id: 2, name: 'Herp', someOtherKey: 'someOtherValue'},
            {id: 3, name: 'Shiny new item'}
          ]
        })
      })
    })

    await worker.loadItems()
    expect(cache.items.en).to.deep.equal([
      {id: 1, name: 'Fiz Buz', someKey: 'someValue'},
      {id: 2, name: 'Herp', someOtherKey: 'someOtherValue'},
      {id: 3, name: 'Shiny new item'}
    ])

    Module.__set__('transformItem', transformer)
  })

  it('loads the item prices', async () => {
    let currentDate = Module.__get__('isoDate')()
    cache.items = {
      en: [
        {id: 1, name: 'Test Item'},
        {id: 2, name: 'Another test item'}
      ]
    }

    worker.api = () => ({
      commerce: () => ({
        prices: () => ({
          all: () => [{
            id: 1,
            buys: {
              quantity: 29731,
              unit_price: 58
            },
            sells: {
              quantity: 42594,
              unit_price: 133
            }
          }]
        })
      })
    })

    await worker.loadItemPrices()
    expect(cache.items.en).to.deep.equal([
      {
        id: 1,
        name: 'Test Item',
        buy: {
          quantity: 29731,
          price: 58,
          last_change: {quantity: 0, price: 0, time: currentDate}
        },
        sell: {
          quantity: 42594,
          price: 133,
          last_change: {quantity: 0, price: 0, time: currentDate}
        },
        last_update: currentDate
      },
      {id: 2, name: 'Another test item'}
    ])
  })

  it('creates an legacy ISO timestamp', () => {
    mockdate.set('Sat Nov 17 2014 05:07:00 GMT+0100 (GMT)')
    expect(Module.__get__('isoDate')()).to.equal('2014-11-17T04:07:00+0000')
    mockdate.reset()

    let date = Module.__get__('isoDate')('Sat Nov 17 2015 05:07:00 GMT+0100 (GMT)')
    expect(date).to.equal('2015-11-17T04:07:00+0000')
  })

  it('transforms an API item into the legacy structure', () => {
    let input = {
      id: 72,
      name: "Berserker's Sneakthief Mask of the Afflicted",
      description: '',
      type: 'Armor',
      level: 62,
      rarity: 'Exotic',
      vendor_value: 265,
      default_skin: 95,
      game_types: [
        'Activity',
        'Wvw',
        'Dungeon',
        'Pve'
      ],
      flags: [
        'SoulBindOnUse'
      ],
      restrictions: [],
      chat_link: '[&AgFIAAAA]',
      icon: 'https://render.guildwars2.com/file/65A0C7367206E6CE4EC7C8CBE07EABAE0191BFBA/561548.png',
      details: {
        type: 'Helm',
        weight_class: 'Medium',
        defense: 68,
        infusion_slots: [],
        infix_upgrade: {
          attributes: [
            {
              attribute: 'Power',
              modifier: 42
            },
            {
              attribute: 'Precision',
              modifier: 30
            },
            {
              attribute: 'CritDamage',
              modifier: 30
            }
          ]
        },
        suffix_item_id: 24687,
        secondary_suffix_item_id: ''
      }
    }
    let output = {
      id: 72,
      name: "Berserker's Sneakthief Mask of the Afflicted",
      description: null,
      level: 62,
      rarity: 5,
      image: 'https://render.guildwars2.com/file/65A0C7367206E6CE4EC7C8CBE07EABAE0191BFBA/561548.png',
      category: [
        0,
        3
      ],
      vendor_price: 265,
      skin: 95,
      tradable: true
    }

    let x = Module.__get__('transformItem')(input)
    expect(x).to.deep.equal(output)
  })

  it('transforms the API item level', () => {
    expect(Module.__get__('transformLevel')(0)).to.equal(null)
    expect(Module.__get__('transformLevel')('80')).to.equal(80)
  })

  it('transforms the API item rarity', () => {
    expect(Module.__get__('transformRarity')('Ascended')).to.equal(6)
  })

  it('transforms the API item level', () => {
    expect(Module.__get__('transformSkin')()).to.equal(null)
    expect(Module.__get__('transformSkin')('80')).to.equal(80)
  })

  it('transforms the API item description', () => {
    expect(Module.__get__('transformDescription')()).to.equal(null)
    expect(Module.__get__('transformDescription')('')).to.equal(null)
    expect(Module.__get__('transformDescription')('Foobar')).to.equal('Foobar')
    expect(Module.__get__('transformDescription')('Foobar <b>Lol</b>')).to.equal('Foobar Lol')
  })

  it('transforms the API item category', () => {
    let a = Module.__get__('transformCategory')('Consumable', {type: 'ContractNpc'})
    expect(a).to.deep.equal([3, 2])

    let b = Module.__get__('transformCategory')('Armor', {})
    expect(b).to.deep.equal([0])

    let c = Module.__get__('transformCategory')('Armor')
    expect(c).to.deep.equal([0])

    let d = Module.__get__('transformCategory')()
    expect(d).to.deep.equal([])
  })

  it('transforms the API item tradable flag', () => {
    let x = Module.__get__('transformTradable')(['AccountBound'])
    expect(x).to.equal(false)

    let y = Module.__get__('transformTradable')(['SomeFlag'])
    expect(y).to.equal(true)
  })

  it('transforms an API item price into the legacy structure', () => {
    let currentDate = Module.__get__('isoDate')()
    let prices = {
      buys: {
        quantity: 156,
        unit_price: 18053
      },
      sells: {
        quantity: 56,
        unit_price: 48053
      }
    }
    let output = {
      buy: {
        quantity: 156,
        price: 18053,
        last_change: {
          time: currentDate,
          quantity: 0,
          price: 0
        }
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: currentDate,
          quantity: 0,
          price: 0
        }
      },
      last_update: currentDate
    }

    let item = {id: 123, name: 'Foo'}
    let x = Module.__get__('transformPrices')(item, prices)
    expect(item).to.deep.equal({id: 123, name: 'Foo'})
    expect(x).to.deep.equal(output)
  })

  it('holds old data if the price information doesn\'t change', () => {
    let currentDate = Module.__get__('isoDate')()
    let itemInput = {
      buy: {
        quantity: 156,
        price: 18053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        }
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        }
      },
      last_update: '2014-11-17T04:07:00+0000'
    }
    let priceInput = {
      buys: {
        quantity: 156,
        unit_price: 18053
      },
      sells: {
        quantity: 56,
        unit_price: 48053
      }
    }
    let expectedOutput = {
      buy: {
        quantity: 156,
        price: 18053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        }
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        }
      },
      last_update: currentDate
    }

    let x = Module.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('can track changes if the price information changes', () => {
    let currentDate = Module.__get__('isoDate')()
    let itemInput = {
      buy: {
        quantity: 156,
        price: 18053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        }
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        }
      },
      last_update: '2014-11-17T04:07:00+0000'
    }
    let priceInput = {
      buys: {
        quantity: 106,
        unit_price: 18153
      },
      sells: {
        quantity: 66,
        unit_price: 48003
      }
    }
    let expectedOutput = {
      buy: {
        quantity: 106,
        price: 18153,
        last_change: {
          time: currentDate,
          quantity: -50,
          price: 100
        }
      },
      sell: {
        quantity: 66,
        price: 48003,
        last_change: {
          time: currentDate,
          quantity: 10,
          price: -50
        }
      },
      last_update: currentDate
    }

    let x = Module.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })
})
