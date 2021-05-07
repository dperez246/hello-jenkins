const { white, red, yellow, green } = require('chalk')

function databaseConnectionFailedLog(err) {
  const log = console.error
  log(`${white(' ☠ ')} ${yellow('DB initializing error')} ${white(' ☠ ')}`)
  log(`${red(' Ha ocurrido un error al inicializar Sequelize ☹ ')}`)
  log(`${green(' Stack del error: ')}`)
  log(white(err))
}

module.exports = {
  databaseConnectionFailedLog,
}
