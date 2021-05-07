const soap = require('soap')
const { wsdl } = require('@auth/vars')
const StandardError = require('standard-error')

const createSoapClient = (route, host) =>
  new Promise((resolve, reject) => {
    soap.createClient(`${host || wsdl.host}/${route}`, (err, client) => {
      if (err) {
        reject(
          new StandardError('errors:noAvailableService', {
            status: 500,
          })
        )
      } else {
        resolve(client)
      }
    })
  })

module.exports = {
  createSoapClient,
}
