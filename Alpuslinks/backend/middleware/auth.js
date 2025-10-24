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
    
    // Refresh the user's active session to keep them online
    // This helps maintain accurate online status
    try {
      const LoginSession = require('../models/LoginSession');
      
      // First, check if there are any active sessions for this user
      const existingSessions = await LoginSession.find({
        user: user._id,
        isActive: true
      }).sort({ loginDate: -1 });
      
      console.log(`🔍 Found ${existingSessions.length} active sessions for user ${user.email} (${user._id})`);
      
      if (existingSessions.length > 0) {
        // Update the most recent session
        const sessionUpdate = await LoginSession.findOneAndUpdate(
          { 
            user: user._id, 
            isActive: true 
          },
          { 
            loginDate: new Date() // Update the login date to keep session fresh
          },
          { sort: { loginDate: -1 } }
        );
        
        if (sessionUpdate) {
          console.log(`🔄 Session refreshed for user ${user.email} (${user._id})`);
        }
      } else {
        console.log(`⚠️ No active session found for user ${user.email} (${user._id}) - creating new session`);
        
        // Create a new session if none exists (this shouldn't happen but let's be safe)
        const newSession = new LoginSession({
          user: user._id,
          loginDate: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          loginMethod: 'api_refresh'
        });
        await newSession.save();
        console.log(`✅ New session created for user ${user.email} (${user._id})`);
      }
    } catch (sessionError) {
      // Don't fail the request if session update fails
      console.log('Session refresh failed:', sessionError.message);
    }
    
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
