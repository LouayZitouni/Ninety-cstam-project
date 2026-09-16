const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      data: { user, token }
    });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const {email} = req.params;
    await authService.deleteUserByEmail(email);
    res.status(204).send(); // Standard HTTP status for successful deletion with no body
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  deleteUser
};
