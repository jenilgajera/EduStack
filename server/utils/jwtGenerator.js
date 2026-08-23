const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

module.exports = { generateToken };