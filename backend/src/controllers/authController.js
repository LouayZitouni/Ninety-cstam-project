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
    const { user, token,refreshToken } = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      data: { user, token,refreshToken }
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

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await authService.logoutUser(req.user.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      accessToken: result.accessToken
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  deleteUser,
  getMe,
  logout,
  refresh
};
