const authorizedAPIs = [
  'https://api.tramiteya.go.cr', // TramiteYa API PROD
  'http://api.tramite-ya.com', // TramiteYa API QA
]

const allowedOrigins = [...authorizedAPIs]

function corsOrigins(origin, callback) {
  if (!origin) return callback(null, true)
  if (
    allowedOrigins.indexOf(origin) === -1 &&
    !/^http.*\.tramiteya.go.cr$/g.test(origin) &&
    !/^http.*\.tramite-ya.com$/g.test(origin)
  ) {
    const msg =
      'The CORS policy for this site does not ' +
      'allow access from the specified Origin.'
    return callback(new Error(msg), false)
  }
  return callback(null, true)
}

module.exports = { origin: corsOrigins, authorizedAPIs }
