const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = data.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
