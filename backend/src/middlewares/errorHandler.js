const dbErrorMap = {

  '23505': { status: 409, message: 'Record already exists (duplicate entry)' },
  '23503': { status: 400, message: 'Referenced entity does not exist' },
  '23502': { status: 400, message: 'Required field is missing' },
  '23514': { status: 400, message: 'Data violates validation constraints' },
  '23P01': { status: 409, message: 'Time or resource booking conflict' },


  '22P02': { status: 400, message: 'Invalid data syntax or ID format' },
  '22001': { status: 400, message: 'Input text exceeds maximum length' },
  '22007': { status: 400, message: 'Invalid date or time format' },
  '22003': { status: 400, message: 'Numeric value out of allowed range' },


  '40001': { status: 409, message: 'Concurrent modification conflict, please retry' },
  '55P03': { status: 503, message: 'Station or session is currently locked by another operation' },


  '53300': { status: 503, message: 'Database connection pool limit reached' },
  '57P01': { status: 500, message: 'Database server connection lost' }
};

const errorHandler = (err ,req ,res,next)=>{
    const dbError = dbErrorMap[err.code];
    const statusCode = dbError?.status || err.statusCode ||err.status ||500 ; 
    const message = dbError?.message ||err.message || 'internal server error' ;

    if (process.env.NODE_ENV !== 'production') {
        console.error('App Error:', err.stack || err); //err.stack prints the exact file name, line number, and execution path where the failure occurred
    }

    res.status(statusCode).json({
        error : message
    });

};

module.exports = errorHandler;




