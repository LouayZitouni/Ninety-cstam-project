
const jwt = require('jsonwebtoken');

const protect = (req , res ,next) =>{
    let token ;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        const error = new Error('Not authorized to access this route');
        error.statusCode = 401;
        return next(error);
    } 

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded
        next();
    }catch(err){
        const error = new Error('Token verification failed or expired');
        error.statusCode = 401;
        return next(error); 
    }
};

module.exports = { protect };