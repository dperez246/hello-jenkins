/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const path = require('path')
const pg = require('pg')

delete pg.native
const Sequelize = require('sequelize')

const {
  env,
  dbs: { postgres },
} = require('@auth/vars')

const basename = path.basename(__filename)
const db = { postgres }
// eslint-disable-next-line no-console
const logging = env !== 'test' ? console.log : null

const sequelize = new Sequelize(
  postgres.database,
  postgres.username,
  postgres.password,
  {
    host: postgres.host,
    port: postgres.port,
    dialect: postgres.dialect,
    pool: {
      max: postgres.max_connections,
      min: postgres.min_connections,
      idle: postgres.idle_timeout,
      acquire: postgres.aquire_timeout,
    },
    dialectOptions: { ssl: false }, // TODO: Pass variable to true
    logging,
  }
)

fs.readdirSync(__dirname)
  .filter(file => {
    const curPath = path.join(__dirname, file)
    if (fs.statSync(curPath).isDirectory()) {
      return true
    }

    return false
  })
  .forEach(folder => {
    const curPath = path.join(__dirname, folder)
    fs.readdirSync(curPath)
      .filter(file => {
        return (
          file.indexOf('.') !== 0 &&
          file !== basename &&
          file.slice(-3) === '.js'
        )
      })
      .forEach(file => {
        const model = sequelize.import(path.join(__dirname, folder, file))
        db[model.name] = model
      })
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

// sequelize.sync()
// sequelize.sync({ force: true })

db.sequelize = sequelize
db.Sequelize = Sequelize

async function authenticate() {
  try {
    await sequelize.authenticate()

    return { dbInitialized: true }
  } catch (error) {
    return { dbInitialized: false, error }
  }
}

module.exports = { ...db, authenticate }
