const dotenv = require('dotenv-safe')
const { join } = require('path')

const env = process.env.ENV_VARS || process.env.NODE_ENV || 'development'

dotenv.config({
  path: join(__dirname, 'env', `.env.${env}`),
  sample: join(__dirname, 'env', '.env.example'),
  allowEmptyValues: true,
})

module.exports = {
  adminToken: process.env.ADMIN_TOKEN,
  appName: process.env.APP_NAME,
  env,
  poweredby: process.env.POWERED_BY,
  secrets: {
    jwt: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    encryptionVector: process.env.ENCRYPTION_VECTOR,
  },
  apis: {
    core: {
      name: process.env.API_NAME,
      token: process.env.API_TOKEN,
      path: process.env.API_PATH,
      ip: process.env.API_IP,
      port: parseInt(process.env.API_PORT, 10),
      route: process.env.API_ROUTE,
      requestsLogger: process.env.API_LOGGER === 'true',
      errorLogger: process.env.API_ERROR_LOGGER === 'true',
    },
  },
  dbs: {
    postgres: {
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      dialect: 'postgres',
      max_connections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS, 10),
      min_connections: parseInt(process.env.POSTGRES_MIN_CONNECTIONS, 10),
      idle_timeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT, 10),
      aquire_timeout: parseInt(process.env.POSTGRES_AQUIRE_TIMEOUT, 10),
    },
  },
  cookies: {
    key: process.env.COOKIES_TOKEN_KEY,
    expiresIn: 1000 * 60 * 60 * parseInt(process.env.COOKIES_EXPIRES_IN, 10),
    domain: process.env.COOKIES_DOMAIN,
    secure: process.env.COOKIES_SECURE === 'true',
    csrfKey: process.env.COOKIES_CSRF_KEY,
  },
  monitoring: {
    apm: {
      server: process.env.MONITORING_APM_SERVER,
      secret: process.env.MONITORING_APM_SECRET,
      enabled: process.env.MONITORING_APM_ENABLED === 'true',
    },
  },
}
