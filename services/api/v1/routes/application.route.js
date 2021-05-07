const { Router } = require('express')

const { isSuperAdmin } = require('@auth/policies')
const {
  create,
  findOne,
  findAll,
  findApp,
} = require('../controllers/application.controller')

const router = Router()

router.route('/').get(findAll)

router.route('/').post(isSuperAdmin, create)

router.route('/findOne').get(findApp)

router.route('/:id').get(findOne)

module.exports = router
