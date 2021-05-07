const StandardError = require('standard-error')
const { adminToken } = require('@auth/vars')
const { monitoring } = require('@auth/utils')

/**
 * Este middleware verifica que un usuario loggeado tenga el rol y el expediente activo
 * La idea es utilizarlo en rutas que necesitan verificar rol y expediente
 * Utilizar dentro de asyncWrapper
 * @param {*} req
 */
async function isSuperAdmin(req) {
  monitoring.apm.setLabel('policy', 'isSuperAdmin')
  if (req.headers['admin-token'] !== adminToken) {
    throw new StandardError('polices:adminToken', {
      status: 401,
    })
  }
}

module.exports = isSuperAdmin
