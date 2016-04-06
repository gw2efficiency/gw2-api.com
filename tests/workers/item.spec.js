/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const mockdate = require('mockdate')

const worker = rewire('../../src/workers/item.js')
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const executeMock = sinon.spy()
worker.__set__('execute', executeMock)

const scheduleMock = sinon.spy()
worker.__set__('schedule', scheduleMock)

describe('workers > item worker', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    executeMock.reset()
    scheduleMock.reset()
    done()
  })

  it('initializes correctly without data', async () => {
    await worker.initialize()

    expect(executeMock.callCount).to.equal(3)
    expect(executeMock.args[0][0].name).to.equal('loadItems')
    expect(executeMock.args[1][0].name).to.equal('loadItemPrices')
    expect(executeMock.args[2][0].name).to.equal('updateItemValues')

    expect(scheduleMock.callCount).to.equal(3)
    expect(scheduleMock.args[0][1].name).to.equal('loadItems')
    expect(scheduleMock.args[1][1].name).to.equal('loadItemPrices')
    expect(scheduleMock.args[2][1].name).to.equal('updateItemValues')
  })

  it('initializes correctly with data', async () => {
    await mongo.collection('items').insert({id: 1, hint: 'placeholder item'})
    await worker.initialize()

    expect(executeMock.callCount).to.equal(0)

    expect(scheduleMock.callCount).to.equal(3)
    expect(scheduleMock.args[0][1].name).to.equal('loadItems')
    expect(scheduleMock.args[1][1].name).to.equal('loadItemPrices')
    expect(scheduleMock.args[2][1].name).to.equal('updateItemValues')
  })

  it('loads the items', async () => {
    let tmp = worker.__get__('transformItem')
    worker.__set__('transformItem', x => x)
    worker.__set__('api', () => ({
      language: () => ({
        items: () => ({
          all: () => new Promise(r => r([{id: 1, name: 'Fiz Buz'}]))
        })
      })
    }))

    await worker.loadItems()
    worker.__set__('transformItem', tmp)

    let items = await mongo.collection('items').find({}, {_id: 0}).sort({lang: 1}).toArray()
    expect(items).to.deep.equal([
      {id: 1, name: 'Fiz Buz', lang: 'de'},
      {id: 1, name: 'Fiz Buz', lang: 'en'},
      {id: 1, name: 'Fiz Buz', lang: 'es'},
      {id: 1, name: 'Fiz Buz', lang: 'fr'}
    ])
  })

  it('doesn\'t overwrite the items', async () => {
    let tmp = worker.__get__('transformItem')
    worker.__set__('transformItem', x => x)

    await mongo.collection('items').insert([
      {id: 1, name: 'Fiz', lang: 'en', someKey: 'someValue'},
      {id: 2, name: 'Herp', lang: 'en'}
    ])

    worker.__set__('api', () => ({
      language: () => ({
        items: () => ({
          all: () => new Promise(r => r([
            {id: 1, name: 'Fiz Buz'},
            {id: 2, name: 'Herp', someOtherKey: 'someOtherValue'},
            {id: 3, name: 'Shiny new item'}
          ]))
        })
      })
    }))

    await worker.loadItems()
    worker.__set__('transformItem', tmp)

    let items = await mongo.collection('items').find({lang: 'en'}, {_id: 0, lang: 0}).sort({id: 1}).toArray()
    expect(items).to.deep.equal([
      {id: 1, name: 'Fiz Buz', someKey: 'someValue'},
      {id: 2, name: 'Herp', someOtherKey: 'someOtherValue'},
      {id: 3, name: 'Shiny new item'}
    ])
  })

  it('loads the item prices', async () => {
    let currentDate = worker.__get__('isoDate')()

    await mongo.collection('items').insert([
      {id: 1, name: 'Test Item', lang: 'en', tradable: true},
      {id: 2, name: 'Another test item', tradable: false, lang: 'en'}
    ])

    worker.__set__('api', () => ({
      commerce: () => ({
        prices: () => ({
          all: () => new Promise(r => r([{
            id: 1,
            buys: {
              quantity: 29731,
              unit_price: 58
            },
            sells: {
              quantity: 42594,
              unit_price: 133
            }
          }]))
        })
      })
    }))

    await worker.loadItemPrices()

    let items = await mongo.collection('items').find({lang: 'en'}, {_id: 0, lang: 0}).sort({id: 1}).toArray()
    expect(items).to.deep.equal([
      {
        id: 1,
        name: 'Test Item',
        buy: {
          quantity: 29731,
          price: 58,
          last_change: {quantity: 0, price: 0, time: currentDate},
          last_known: 58
        },
        sell: {
          quantity: 42594,
          price: 133,
          last_change: {quantity: 0, price: 0, time: currentDate},
          last_known: 133
        },
        last_update: currentDate,
        tradable: true
      },
      {id: 2, name: 'Another test item', tradable: false}
    ])
  })

  it('updates the item values', async () => {
    await mongo.collection('items').insert([
      {id: 1, lang: 'en', sell: {price: 123}},
      {id: 2, lang: 'en', buy: {price: 456}, value: 456},
      {id: 38506, lang: 'en', buy: {price: 555}, value: 10},
      {id: 38507, lang: 'en', sell: {price: 12345}},
      {id: 73476, lang: 'en'}
    ])

    await worker.updateItemValues()

    let items = await mongo.collection('items')
      .find({lang: 'en'}, {_id: 0, lang: 0, valueIsVendor: 0})
      .sort({id: 1}).toArray()

    expect(items).to.deep.equal([
      {id: 1, sell: {price: 123}, value: 123},
      {id: 2, buy: {price: 456}, value: 456},
      {id: 38506, buy: {price: 555}, value: 12345},
      {id: 38507, sell: {price: 12345}, value: 12345},
      {id: 73476, value: 100000}
    ])
  })

  it('updates the item values for ascended boxes', async () => {
    await mongo.collection('items').insert([
      {
        id: 123,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        sell: {price: 100},
        lang: 'en',
        category: [0]
      },
      {
        id: 124,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        lang: 'en',
        category: [0]
      },
      {
        id: 125,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        sell: {price: 200},
        lang: 'en',
        category: [14]
      },
      {
        id: 126,
        name: 'wupwup item',
        rarity: 6,
        craftable: false,
        sell: {price: 300},
        lang: 'en',
        category: [14]
      },
      {
        id: 127,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        sell: {price: 400},
        lang: 'en',
        category: [3]
      },
      {
        id: 128,
        name: 'wupwup item',
        rarity: 5,
        craftable: true,
        sell: {price: 500},
        lang: 'en',
        category: [14]
      },
      {
        id: 129,
        name: 'wupwup item',
        rarity: 6,
        craftable: true,
        vendor_price: 600,
        sell: {price: 600},
        lang: 'en',
        category: [14]
      },
      {
        id: 130,
        name: 'Nightfury',
        rarity: 6,
        craftable: true,
        sell: {price: 700},
        lang: 'en',
        category: [14]
      },
      {id: 1, rarity: 6, category: [4, 0], lang: 'en', sell: {price: 1}, name: 'Wupwup Chest'},
      {id: 2, rarity: 6, category: [4, 0], lang: 'en', sell: {price: 1}, name: 'Recipe for something'},
      {id: 3, rarity: 6, category: [4, 1], lang: 'en', sell: {price: 1}, name: 'Another Chest'},
      {id: 4, rarity: 6, category: [4, 1], lang: 'en', sell: {price: 1}, name: 'Worldboss Hoard'}
    ])

    await worker.updateItemValues()

    let items = await mongo.collection('items')
      .find({lang: 'en', id: {$in: [1, 2, 3, 4]}}, {_id: 0, id: 1, value: 1})
      .sort({id: 1}).toArray()

    expect(items).to.deep.equal([
      {id: 1, value: 150},
      {id: 2, value: 1},
      {id: 3, value: 150},
      {id: 4, value: 150}
    ])
  })

  it('creates an legacy ISO timestamp', () => {
    mockdate.set('Sat Nov 17 2014 05:07:00 GMT+0100 (GMT)')
    expect(worker.__get__('isoDate')()).to.equal('2014-11-17T04:07:00+0000')
    mockdate.reset()

    let date = worker.__get__('isoDate')('Sat Nov 17 2015 05:07:00 GMT+0100 (GMT)')
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

    let x = worker.__get__('transformItem')(input)
    expect(x).to.deep.equal(output)
  })

  it('transforms the API item level', () => {
    expect(worker.__get__('transformLevel')(0)).to.equal(null)
    expect(worker.__get__('transformLevel')('80')).to.equal(80)
  })

  it('transforms the API item rarity', () => {
    expect(worker.__get__('transformRarity')('Ascended')).to.equal(6)
  })

  it('transforms the API item level', () => {
    expect(worker.__get__('transformSkin')()).to.equal(null)
    expect(worker.__get__('transformSkin')('80')).to.equal(80)
  })

  it('transforms the API item description', () => {
    expect(worker.__get__('transformDescription')()).to.equal(null)
    expect(worker.__get__('transformDescription')('')).to.equal(null)
    expect(worker.__get__('transformDescription')('Foobar')).to.equal('Foobar')
    expect(worker.__get__('transformDescription')('Foobar <b>Lol</b>')).to.equal('Foobar Lol')
  })

  it('transforms the API item category', () => {
    let a = worker.__get__('transformCategory')('Consumable', {type: 'ContractNpc'})
    expect(a).to.deep.equal([3, 2])

    let b = worker.__get__('transformCategory')('Armor', {})
    expect(b).to.deep.equal([0])

    let c = worker.__get__('transformCategory')('Armor')
    expect(c).to.deep.equal([0])

    let d = worker.__get__('transformCategory')()
    expect(d).to.deep.equal([])
  })

  it('transforms the API item tradable flag', () => {
    let x = worker.__get__('transformTradable')(['AccountBound'])
    expect(x).to.equal(false)

    let y = worker.__get__('transformTradable')(['SomeFlag'])
    expect(y).to.equal(true)
  })

  it('transforms an API item price into the legacy structure', () => {
    let currentDate = worker.__get__('isoDate')()
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
        },
        last_known: 18053
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: currentDate,
          quantity: 0,
          price: 0
        },
        last_known: 48053
      },
      last_update: currentDate
    }

    let item = {id: 123, name: 'Foo'}
    let x = worker.__get__('transformPrices')(item, prices)
    expect(item).to.deep.equal({id: 123, name: 'Foo'})
    expect(x).to.deep.equal(output)
  })

  it('holds old data if the price information doesn\'t change', () => {
    let currentDate = worker.__get__('isoDate')()
    let itemInput = {
      buy: {
        quantity: 156,
        price: 18053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 18053
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 48053
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
        },
        last_known: 18053
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 48053
      },
      last_update: currentDate
    }

    let x = worker.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('can track changes if the price information changes', () => {
    let currentDate = worker.__get__('isoDate')()
    let itemInput = {
      buy: {
        quantity: 156,
        price: 18053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 18053
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 48053
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
        },
        last_known: 18153
      },
      sell: {
        quantity: 66,
        price: 48003,
        last_change: {
          time: currentDate,
          quantity: 10,
          price: -50
        },
        last_known: 48003
      },
      last_update: currentDate
    }

    let x = worker.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('updates the crafting price if the item has crafting information', () => {
    let currentDate = worker.__get__('isoDate')()
    let itemInput = {
      buy: {
        quantity: 156,
        price: 18053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 18053
      },
      sell: {
        quantity: 56,
        price: 48053,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 48053
      },
      last_update: '2014-11-17T04:07:00+0000',
      crafting: {
        buy: 10000
      }
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
        },
        last_known: 18153
      },
      sell: {
        quantity: 66,
        price: 48003,
        last_change: {
          time: currentDate,
          quantity: 10,
          price: -50
        },
        last_known: 48003
      },
      last_update: currentDate,
      craftingProfit: 30803
    }

    let x = worker.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('keeps the last known price if the current price gets set to 0', () => {
    let currentDate = worker.__get__('isoDate')()
    let itemInput = {
      buy: {
        quantity: 156,
        price: 200,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 100
      },
      sell: {
        quantity: 56,
        price: 200,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 48053
      },
      last_update: '2014-11-17T04:07:00+0000',
      crafting: {
        buy: 10000
      }
    }
    let priceInput = {
      buys: {
        quantity: 106,
        unit_price: 0
      },
      sells: {
        quantity: 66,
        unit_price: 0
      }
    }
    let expectedOutput = {
      buy: {
        quantity: 106,
        price: 0,
        last_change: {
          time: currentDate,
          quantity: -50,
          price: -200
        },
        last_known: 200
      },
      sell: {
        quantity: 66,
        price: 0,
        last_change: {
          time: currentDate,
          quantity: 10,
          price: -200
        },
        last_known: 200
      },
      last_update: currentDate,
      craftingProfit: -10000
    }

    let x = worker.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('keeps the last known price if there is no current price', () => {
    let currentDate = worker.__get__('isoDate')()
    let itemInput = {
      buy: {
        quantity: 156,
        price: 0,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 100
      },
      sell: {
        quantity: 56,
        price: 0,
        last_change: {
          time: '2014-11-17T04:07:00+0000',
          quantity: 0,
          price: 0
        },
        last_known: 48053
      },
      last_update: '2014-11-17T04:07:00+0000',
      crafting: {
        buy: 10000
      }
    }
    let priceInput = {
      buys: {
        quantity: 106,
        unit_price: 0
      },
      sells: {
        quantity: 66,
        unit_price: 0
      }
    }
    let expectedOutput = {
      buy: {
        quantity: 106,
        price: 0,
        last_change: {
          time: currentDate,
          quantity: -50,
          price: 0
        },
        last_known: 100
      },
      sell: {
        quantity: 66,
        price: 0,
        last_change: {
          time: currentDate,
          quantity: 10,
          price: 0
        },
        last_known: 48053
      },
      last_update: currentDate,
      craftingProfit: -10000
    }

    let x = worker.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })
})
