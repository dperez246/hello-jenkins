/* eslint-disable no-restricted-globals */
const StandardError = require('standard-error')
const { Sequelize } = require('@auth/db')

const sendError = (message, status) => {
  const statusCode = {
    status: status || 400,
  }
  throw new StandardError(message, statusCode)
}

const toObject = data => {
  const response = JSON.stringify(data)
  return JSON.parse(response)
}

const getModelName = model => {
  const { options } = model
  let modelName = model.name
  if (options) modelName = options.spanishName
  return modelName
}

const addFilters = params => {
  const data = params
  const { skip, limit, status } = data
  if (skip) delete data.skip
  if (limit) delete data.limit
  data.status = validateStatuses(status)
  return data
}

const validateStatuses = status => {
  if (!status) return 1
  if (isNaN(status) && status === 'Op.ne') return { [Sequelize.Op.ne]: -1 }
  if (isNaN(status)) sendError('errors:statusInteger')
  return status
}

const addStatusFilter = () => {
  const status = { [Sequelize.Op.ne]: -1 }
  return status
}

module.exports = {
  sendError,
  toObject,
  getModelName,
  addFilters,
  addStatusFilter,
}
