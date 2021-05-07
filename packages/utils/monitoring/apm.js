const elasticAPM = require('elastic-apm-node')
const { env, monitoring } = require('@auth/vars')

let apm = null

const start = (serviceName, frameworkName, frameworkVersion) => {
  apm = elasticAPM.start({
    serviceName: serviceName || `autoINIT`,
    serviceVersion: frameworkVersion || '1.0.0',
    secretToken: monitoring.apm.secret,
    serverUrl: monitoring.apm.server,
    captureBody: 'error',
    logUncaughtExceptions: true,
    stackTraceLimit: 100,
    apiRequestSize: '1mb',
    serverTimeout: '60s',
    frameworkName: frameworkName || `node-js-api`,
    frameworkVersion: frameworkVersion || '1.0.0',
    active: monitoring.apm.enabled,
    environment: env,
  })
  return apm
}

const getInstance = () => {
  return apm
}

const execAPMFunction = (func, ...params) => {
  if (!apm) {
    start()
  }
  apm[func](...params)
}

const captureError = error => {
  if (error && error.previousError) {
    execAPMFunction('captureError', error.previousError)
  } else {
    execAPMFunction('captureError', error)
  }
}

const setUserContext = context => {
  execAPMFunction('setUserContext', context)
}

const setCustomContext = context => {
  execAPMFunction('setCustomContext', context)
}

const setLabel = (label, value) => {
  execAPMFunction('setLabel', label, value)
}

const startAPMTransactionHTTP = (req, res, next) => {
  // req.apmTransaction = apm.startTransaction
  next()
}

module.exports = {
  start,
  getInstance,
  captureError,
  setUserContext,
  setCustomContext,
  setLabel,
  startAPMTransactionHTTP,
}
