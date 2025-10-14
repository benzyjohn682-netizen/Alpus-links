const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token, authorization denied',
        code: 'NO_TOKEN'
      });
    }

    // Use configured secret or a safe default to match token issuer
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    const userId = decoded?.user?.id || decoded?.userId || decoded?.id;
    const user = await User.findById(userId).populate('role', 'name permissions').select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token is not valid',
        code: 'INVALID_TOKEN'
      });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ 
        message: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(401).json({ 
      message: 'Token is not valid',
      code: 'INVALID_TOKEN'
    });
  }
};

module.exports = auth;
