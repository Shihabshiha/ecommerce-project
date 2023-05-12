
require('dotenv').config()

const mongoClient = require('mongodb').MongoClient

const state = {
  db: null
}

module.exports.connect = function (done) {
  const url = process.env.MONGO_ATLAS
  const dbname = 'ecommerce'

  mongoClient.connect(url, (err, data) => {
    if (err) return done(err)
    state.db = data.db(dbname)

    
  })
}


module.exports.get = function () {
  return state.db
}
