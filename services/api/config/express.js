/* eslint-disable import/no-unresolved */
const express = require('express')
const i18next = require('i18next')
const StandardError = require('standard-error')
const i18nextMiddleware = require('i18next-express-middleware')
const bodyParser = require('body-parser')
const bearerToken = require('express-bearer-token')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { join } = require('path')
const csrf = require('csurf')
const { authenticate } = require('@auth/db')
const {
  customResponse,
  launch,
  databaseConnectionFailedLog,
  middleware,
  monitoring,
} = require('@auth/utils')
const policies = require('@auth/policies')
const vars = require('@auth/vars')
const { api: resources } = require('@auth/locales')
const pjson = require('../package.json')

const { apis, env, cookies, monitoring: monitoringVars, poweredby } = vars
const { core } = apis
const routes = require('../v1/routes')

const apm = monitoring.apm.start(core.name, pjson.name, pjson.version)

const csrfProtection = csrf({
  cookie: {
    key: cookies.csrfKey,
    httpOnly: true,
    domain: cookies.domain,
    sameSite: true,
    secure: cookies.secure,
  },
})

const initPingStatus = app => {
  const pingResp = (req, res) => {
    res.status(200).success({
      message: 'Notification API working fine!',
      status: 200,
      data: {
        message: 'Notification API working fine!',
      },
    })
  }
  app.get('/ping', pingResp)
  app.get('/', pingResp)
}

const initRoutes = app => {
  app.use('/api/v1', routes)

  // default when the route does not exist
  app.all('*', (req, res) => {
    res.status(404).send("you're lost?")
  })
}

i18next.use(i18nextMiddleware.LanguageDetector).init({
  ns: ['policies'],

  defaultNS: 'errors',
  resources,
  fallbackLng: 'es',
  preload: ['es', 'en'],
  debug: false,
})

const initMiddlewares = app => {
  if (core.requestsLogger) {
    app.use(middleware.requestsLogger)
  }
  app.use(express.static(join(__dirname, '../public')))
  app.use(bodyParser.json({ limit: '50mb', extended: true }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

  app.use(
    cors({
      origin: policies.cors.origin,
    })
  )

  app.use(bearerToken())

  app.use(cookieParser())

  app.use((req, res, next) => {
    // eslint-disable-next-line no-underscore-dangle
    if (!req.token) {
      req.token = req.cookies ? req.cookies[cookies.key] : null
    }

    next()
  })

  app.use((req, res, next) => {
    const originUrl = req.headers.origin || req.headers.originurl
    policies.cors.origin(originUrl, (error, isValid) => {
      if (isValid) {
        res.setHeader('Access-Control-Allow-Origin', originUrl)
        res.setHeader('Vary', 'Origin')
        res.removeHeader('X-Powered-By')
        res.append('X-Powered-By', poweredby)
        next()
      } else {
        next(error)
      }
    })
  })

  app.use(i18nextMiddleware.handle(i18next)) // Local

  app.use((req, res, next) => {
    if (
      policies.cors.authorizedAPIs.includes(
        req.headers.origin || req.headers.originurl
      )
    ) {
      next()
      return
    }

    csrfProtection(req, res, next)
  })

  customResponse({ express: app })
}

process.on('SIGINT', () => {
  // some other closing procedures go here
  process.exit(1)
})

module.exports.init = async () => {
  const app = express()
  initPingStatus(app)
  initMiddlewares(app)
  initRoutes(app)

  const { dbInitialized, error: errDb } = await authenticate()

  if (!dbInitialized) {
    databaseConnectionFailedLog(errDb)
    process.exit(1)
  }

  app.use((error, req, res, next) => {
    if (monitoringVars.apm.enabled) {
      apm.captureError(
        error && error.previousError ? error.previousError : error
      )
    }
    if (error.code === 'EBADCSRFTOKEN') {
      res.status(401).error(
        new StandardError(req.t('polices:csrfTokenNotValid'), {
          status: 401,
        })
      )
      next()
      return
    }

    const newError = error
    if (error instanceof StandardError) {
      const errorMessage = req.t(newError.message, 'notFound')
      if (errorMessage !== 'notFound') {
        newError.message = errorMessage
      }
    }
    const { status = 500 } = error
    res.status(status).error(newError)

    next()
  })

  app
    .listen(core.port, () => {
      launch({
        ENV: env,
        PORT: core.port,
        HOST: core.path,
        IP: core.ip,
        VERSION: pjson.version,
        NAME: core.name,
      })
    })
    .on('error', err => {
      // eslint-disable-next-line no-console
      console.log(err)
    })

  return app
}
