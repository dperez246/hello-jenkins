const { sequelize, authenticate } = require('@auth/db')
const { databaseConnectionFailedLog } = require('@auth/utils')

const init = async () => {
  const { dbInitialized, error: errDb } = await authenticate()

  if (!dbInitialized) {
    databaseConnectionFailedLog(errDb)
    process.exit(1)
  }

  sequelize.sync({ force: true })
}

init()
