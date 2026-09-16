const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../infrastructure/database/userRepository');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'supersecretkey',
    { expiresIn: process.env.JWT_EXPIRES_IN}
  );
};

const registerUser = async ({username , email , password ,role}) =>{
    if(!password || password.length<6){
        const error = new Error("password must be at least 6 characters");
        error.statusCode = 401;
        throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password , salt); 

    const user = await userRepo.createUser({
        username : username?.trim(),
        email :email?.trim().toLowerCase(),
        passwordHash,role
    });
    const token = generateToken(user.id, user.role);
    return {user,token};
};

const loginUser = async({email,password}) =>{
    if (!email || !password){
        const error = new Error("email and password are required");
        error.statusCode = 400;
        throw error;
    }

    const user = await userRepo.findUserByEmail(email);
    if (!user){
        const error = new Error('invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password , user.password_hash);

    if(!isPasswordValid){
        const error = new Error('incorrect password !');
        error.statusCode = 401;
        throw error;
    }

    const token = generateToken(user.id, user.role);
    delete user.password_hash;

    return { user, token };

};

const deleteUserByEmail = async(email) =>{
    if(!email){
        const error = new Error('email is required');
        error.statusCode=400;
        throw error
    }
    const result = await userRepo.deleteUserByEmail(email);

    if (!result) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
    }
    return { message: 'User deleted successfully', deletedUser: result };
}


module.exports = {
  registerUser,
  loginUser,
  deleteUserByEmail
};
