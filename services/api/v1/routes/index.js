const { Router } = require('express')

const application = require('./application.route')

const router = Router()

router.use('/application', application)

module.exports = router
