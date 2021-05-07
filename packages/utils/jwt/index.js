const jwt = require('jsonwebtoken')
const StandardError = require('standard-error')
const vars = require('@auth/vars')

const { jwt: jwtSecret } = vars.secrets

/**
 * Esta función genera un json web token [https://jwt.io/introduction/]
 *
 * @param {*} payload es un objeto con los datos que se quieren firmar en el token, no
 * poner datos sensibles.
 * @param {*} [options={}] [https://www.npmjs.com/package/jsonwebtoken#usage]
 * @param {*} [secret=jwtSecret] se toma como default el definido en las variables de
 * ambiente, si se indica uno, se sobreescribe
 * @returns JSON Web Token String
 */
async function sign(payload, options = {}, secret = jwtSecret) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        return reject(new StandardError(err, { status: 403, code: 'E_JWT' }))
      }

      return resolve(token)
    })
  })
}

/**
 * Esta funcion certifica que un token esté bien formado, y que el secret
 * sea el utilizado cuando lo firmaron.
 * @param {*} token Json Web Token string, obtenido del header Authorization, Bearer JWTString
 * @param {*} [options={}] [https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback]
 * @param {*} [secret=jwtSecret] se toma como default el definido en las variables de
 * ambiente, si se indica uno, se sobreescribe
 * @returns payload utilizado en la encriptación
 */
async function verify(token, options = {}, secret = jwtSecret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) => {
      if (err) {
        return reject(
          new StandardError(
            err.name === 'TokenExpiredError'
              ? {
                  status: 401,
                  code: err.name,
                  message: 'errors:TokenExpiredError',
                }
              : err,
            { status: 403, code: 'E_JWT' }
          )
        )
      }

      return resolve(decoded)
    })
  })
}

module.exports = {
  sign,
  verify,
}
