/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')

const transformItem = rewire('../../../src/jobs/items/_transformItem.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

describe('jobs > items > transformItem', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('items').deleteMany({})
    done()
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
        skins: [123],
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
      skins: [95, 123],
      tradable: true
    }

    let x = transformItem.__get__('transformItem')(input)
    expect(x).to.deep.equal(output)
  })

  it('transforms the API item level', () => {
    expect(transformItem.__get__('transformLevel')(0)).to.equal(null)
    expect(transformItem.__get__('transformLevel')('80')).to.equal(80)
  })

  it('transforms the API item rarity', () => {
    expect(transformItem.__get__('transformRarity')('Ascended')).to.equal(6)
  })

  it('transforms the API item vendor price', () => {
    expect(transformItem.__get__('transformVendorPrice')(123, [])).to.equal(123)
    expect(transformItem.__get__('transformVendorPrice')(123, ['NoSell', 'AccountBound'])).to.equal(null)
  })

  it('transforms the API item skin', () => {
    expect(transformItem.__get__('transformSkins')({default_skin: 80})).to.deep.equal([80])
    expect(transformItem.__get__('transformSkins')({details: {skins: [123, 456]}})).to.deep.equal([123, 456])
    expect(transformItem.__get__('transformSkins')({})).to.deep.equal([])
  })

  it('transforms the API item description', () => {
    expect(transformItem.__get__('transformDescription')()).to.equal(null)
    expect(transformItem.__get__('transformDescription')('')).to.equal(null)
    expect(transformItem.__get__('transformDescription')('Foobar')).to.equal('Foobar')
    expect(transformItem.__get__('transformDescription')('Foobar <b>Lol</b>')).to.equal('Foobar Lol')
  })

  it('transforms the API item category', () => {
    let a = transformItem.__get__('transformCategory')('Consumable', {type: 'ContractNpc'})
    expect(a).to.deep.equal([3, 2])

    let b = transformItem.__get__('transformCategory')('Armor', {})
    expect(b).to.deep.equal([0])

    let c = transformItem.__get__('transformCategory')('Armor')
    expect(c).to.deep.equal([0])

    let d = transformItem.__get__('transformCategory')()
    expect(d).to.deep.equal([])
  })

  it('transforms the API item tradable flag', () => {
    transformItem.__set__('tradingpostBlacklist', [123])

    let x = transformItem.__get__('transformTradable')(['AccountBound'], 1)
    expect(x).to.equal(false)

    let y = transformItem.__get__('transformTradable')(['SomeFlag'], 2)
    expect(y).to.equal(true)

    let z = transformItem.__get__('transformTradable')([], 123)
    expect(z).to.equal(false)
  })
})
