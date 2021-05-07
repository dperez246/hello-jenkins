const StandardError = require('standard-error')
const uuidv4 = require('uuid/v4')
const { Application } = require('@auth/db')

async function create(req, res, next) {
  try {
    const { name, token, code, route } = req.body

    if (!name) {
      throw new StandardError('errors:noName', { status: 400 })
    }

    if (!code) {
      throw new StandardError('application:noApplicationCode', {
        status: 400,
      })
    }

    if (!route) {
      throw new StandardError('application:applicationRoute', {
        status: 400,
      })
    }

    const application = await Application.findOne({
      where: { code },
    })

    if (application) {
      throw new StandardError('application:applicationNameExist', {
        status: 400,
      })
    }

    const data = await Application.create({
      name,
      token: token || uuidv4(),
      code,
      route,
    })

    if (!data) {
      throw new StandardError('application:errorCreateApp', {
        status: 404,
      })
    }
    res.success({
      message: 'Aplicación creada exitosamente',
      data,
    })
  } catch (error) {
    next(error)
  }
}

async function findOne(req, res, next) {
  try {
    const { id } = req.params

    if (!id) {
      throw new StandardError('errors:noId', { status: 400 })
    }

    const data = await Application.findOne({
      where: { id },
    })

    res.success({
      message: 'Consulta de aplicación exitosa',
      data,
    })
  } catch (error) {
    next(error)
  }
}

async function findAll(req, res, next) {
  try {
    const data = await Application.findAll({})

    res.success({
      message: 'Consulta de aplicación exitosa',
      data,
    })
  } catch (error) {
    next(error)
  }
}

async function findApp(req, res, next) {
  try {
    const data = await Application.findOne({
      where: req.query,
    })

    res.success({
      message: 'Consulta de aplicación exitosa',
      data,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { create, findOne, findAll, findApp }
