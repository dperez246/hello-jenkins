const bluebird = require('bluebird')

/**
 * Esta función lo que hace es envolver cualquier middleware async, en un try/catch
 * para centralizar los errores, se le pueden pasar varios middlewares asíncronos
 * o solo uno. Si como último argumento se pasa un object, se toma como opciones
 * de momento la única opción es si se quieren ejecutar los middlewares de forma
 * serial, de lo contrario se ejecutan en paralelo.
 * @param {*} fns middlewares a ejecutar un array o argumentos separados por coma
 * @returns none ejecuta el next que es pasado al middleware
 */
function asyncWrapper(...fns) {
  const lastIndex = fns.length - 1
  let serially = false

  if (
    typeof fns[lastIndex] === 'object' &&
    typeof fns[lastIndex].then !== 'function'
  ) {
    serially = fns[lastIndex].serially === true
    fns.pop()
  }

  const multiple = fns.length > 1

  return async (req, res, next) => {
    try {
      if (multiple) {
        if (serially) {
          await bluebird.each(
            fns.map(fn => fn(req, res, next)),
            value => value
          )
        } else {
          await Promise.all(fns.map(fn => fn(req, res, next)))
        }
      } else {
        const [fn] = fns

        await fn(req, res, next)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = asyncWrapper
