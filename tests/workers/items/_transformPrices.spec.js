/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')
const mockdate = require('mockdate')

const transformPrices = rewire('../../../src/workers/items/_transformPrices.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('workers > items > transformPrices', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('transforms an API item price into the legacy structure', () => {
    let currentDate = transformPrices.__get__('isoDate')()
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
    let x = transformPrices.__get__('transformPrices')(item, prices)
    expect(item).to.deep.equal({id: 123, name: 'Foo'})
    expect(x).to.deep.equal(output)
  })

  it('holds old data if the price information doesn\'t change', () => {
    let currentDate = transformPrices.__get__('isoDate')()
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

    let x = transformPrices.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('can track changes if the price information changes', () => {
    let currentDate = transformPrices.__get__('isoDate')()
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

    let x = transformPrices.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('updates the crafting price if the item has crafting information', () => {
    let currentDate = transformPrices.__get__('isoDate')()
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

    let x = transformPrices.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('keeps the last known price if the current price gets set to 0', () => {
    let currentDate = transformPrices.__get__('isoDate')()
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

    let x = transformPrices.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('keeps the last known price if there is no current price', () => {
    let currentDate = transformPrices.__get__('isoDate')()
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

    let x = transformPrices.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('sets the last known price even if there is no item yet', () => {
    let currentDate = transformPrices.__get__('isoDate')()
    let itemInput = {}
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
          quantity: 0,
          price: 0
        },
        last_known: false
      },
      sell: {
        quantity: 66,
        price: 0,
        last_change: {
          time: currentDate,
          quantity: 0,
          price: 0
        },
        last_known: false
      },
      last_update: currentDate
    }

    let x = transformPrices.__get__('transformPrices')(itemInput, priceInput)
    expect(x).to.deep.equal(expectedOutput)
  })

  it('creates an legacy ISO timestamp', () => {
    mockdate.set('Sat Nov 17 2014 05:07:00 GMT+0100 (GMT)')
    expect(transformPrices.__get__('isoDate')()).to.equal('2014-11-17T04:07:00+0000')
    mockdate.reset()

    let date = transformPrices.__get__('isoDate')('Sat Nov 17 2015 05:07:00 GMT+0100 (GMT)')
    expect(date).to.equal('2015-11-17T04:07:00+0000')
  })
})
