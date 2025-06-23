
// This is the middleware for global eror handling.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;
  
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  
  // These are for handling database specific errors.
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    message = 'Validation error';
  }
  
  return res.status(statusCode).json({
    status: 'error',
    message,
    errors,
    //Include stack trace only in development environment. Do not return the error in prod.
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = errorHandler;