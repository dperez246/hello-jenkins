const { api: esApi } = require('./es')
const { api: esCRApi } = require('./es-CR')
const { api: enApi } = require('./en')
const { api: enUSApi } = require('./en-US')

exports.api = {
  es: esApi,
  'es-CR': esCRApi,
  en: enApi,
  'en-US': enUSApi,
}
