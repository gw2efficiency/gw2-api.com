const mongo = require('../helpers/mongo.js')

let recipesCollection = mongo.collection('recipe-trees')
recipesCollection.createIndex('id')

let skinCollection = mongo.collection('cache')
skinCollection.createIndex('id')

let collection = mongo.collection('items')
collection.createIndex('id')
collection.createIndex('lang')
