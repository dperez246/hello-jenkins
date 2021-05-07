const asyncWrapper = require('./asyncWrapper')
const isLoggedIn = require('./isLoggedIn')
const isSuperAdmin = require('./isSuperAdmin')
const cors = require('./cors')

module.exports = {
  asyncWrapper,
  isLoggedIn: asyncWrapper(isLoggedIn),
  isSuperAdmin: asyncWrapper(isSuperAdmin),
  cors,
}
