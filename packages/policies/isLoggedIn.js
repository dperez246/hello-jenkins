const StandardError = require('standard-error')
const { jwt } = require('@auth/utils')
const { logged } = require('@auth/vars')

/**
 * Este middleware verifica que se haya declarado un user-token o el api-token
 * de lo contrario indicar un error.
 * La idea es utilizarlo en rutas que necesitan seguridad
 * Utilizar dentro de asyncWrapper
 * @param {*} req
 */
async function isLoggedIn(req) {
  let isApiJWTDeclared = false
  const { headers } = req

  if (req.token && req.token !== 'undefined') {
    isApiJWTDeclared = true
    req.token = await jwt.verify(req.token)
  }

  if (
    headers &&
    headers['logged-token'] &&
    headers['logged-token'] !== 'undefined'
  ) {
    isApiJWTDeclared = headers['logged-token'] === logged.token
  }

  if (!isApiJWTDeclared) {
    throw new StandardError('polices:isApiJWTDeclared', {
      status: 401,
    })
  }
}

module.exports = isLoggedIn
