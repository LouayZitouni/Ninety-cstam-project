const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../infrastructure/database/userRepository');
require('dotenv').config();
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN||'24'}
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

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );

    await userRepo.saveRefreshToken(user.id, refreshToken);
    return { user, token, refreshToken};

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

const getProfile = async (userId) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    const error = new Error('User account does not exists');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const logoutUser = async (userId) => {
  const user = await userRepo.revokeRefreshToken(userId);
  if (!user) {
    const error = new Error('User account not found or session already terminated');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Session invalidated and logged out successfully' };
};

const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  // 1. Validate JWT signature and expiration
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify token matches PostgreSQL database record
  const user = await userRepo.findUserByRefreshToken(incomingRefreshToken);
  if (!user) {
    const error = new Error('Session revoked or token invalid');
    error.statusCode = 401;
    throw error;
  }

  // 3. Issue a fresh access token
  const newAccessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { accessToken: newAccessToken };
};



module.exports = {
  registerUser,
  loginUser,
  deleteUserByEmail,
  getProfile,
  logoutUser,
  refreshAccessToken
};
