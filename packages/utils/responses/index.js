function success({ message, status = 200, data, pages, paginate }) {
  this.status = status
  this.send({
    statusCode: status,
    status: 'success',
    errors: null,
    data,
    pages,
    paginate,
    message,
  })
}

function error({ message, status = 500, errors }) {
  this.send({
    statusCode: status,
    status: 'error',
    data: null,
    errors,
    message,
  })
}

module.exports = ({ express }) => {
  const app = express

  app.response.success = success
  app.response.error = error
}
