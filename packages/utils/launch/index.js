const { cyan, green, blue, white, yellow } = require('chalk')

const { log } = console

function line() {
  log(
    '----------------------------------------------------------------------------'
  )
}

function ascii() {
  log(`${' '.repeat(16)}${yellow('____________________')}`)
  log(`${' '.repeat(15)}${yellow('|\\                   \\      l____')}`)
  log(`${' '.repeat(15)}${yellow('| \\___________________\\     |\\   \\')}`)
  log(`${' '.repeat(15)}${yellow('| |                    |    |\\l___\\___')}`)
  log(
    `${' '.repeat(10)}${yellow(
      '[__]_[ |        AUTH        |[\\\\]| |__|_\\__\\'
    )}`
  )
  log(
    `${' '.repeat(9)}${yellow(
      '/\\[__]\\ |                    |\\[\\\\]\\|. | |===\\'
    )}`
  )
  log(
    `${' '.repeat(9)}${yellow(
      '\\ \\[__]\\[____________________] \\[__]|__|..___]'
    )}`
  )
  log(
    `${' '.repeat(10)}${yellow(
      '\\/.-.\\_______________________\\/.-.\\____\\/.-.\\'
    )}`
  )
  log(
    `${' '.repeat(11)}${yellow('( @ )                        ( @ )  =  ( @ )')}`
  )
  log(
    `${' '.repeat(12)}${yellow("`-'                          `-'       `-'")}`
  )
}

function info(data) {
  let debug = false
  if (
    process.execArgv.includes('--debug') ||
    process.execArgv.includes('--inspect')
  ) {
    debug = true
  }
  const { ENV, PORT, HOST, IP, VERSION, NAME } = data

  log(` ⌛  ${green(new Date())}`)
  log(` ${blue('Name           : ')} ${cyan(`⟁  ${NAME}`)}`)
  log(` ${blue('Environment    : ')} ${cyan(`⚒  ${ENV}`)}`)
  if (debug) log(` ${blue('Debugger       : ')} ${cyan('⚑  True')}`)
  if (PORT) log(` ${blue('Port           : ')} ${cyan(`⚙  ${PORT}`)}`)
  if (HOST) log(` ${blue('Host           : ')} ${cyan(`⌦  ${HOST}`)}`)
  if (IP) log(` ${blue('IP             : ')} ${cyan(`@  ${IP}`)}`)
  log(` ${blue('Version        : ')} ${cyan(`⊜  ${VERSION}`)}`)
  log(` ${blue('Executer User  : ')} ${cyan(`♙  ${process.env.LOGNAME}`)}`)
  log(` ${white(`✂ To stop ${NAME}, press <CTRL> + C at any time`)}`)
}

function init(data) {
  ascii()
  line()
  info(data)
  line()
}

module.exports = init
