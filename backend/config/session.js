


require('dotenv').config();


const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'smartschool_default_secret',
  resave: false,              
  saveUninitialized: false,   
  name: 'smartschool.sid',    
  cookie: {
    httpOnly: true,           
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 2 * 60 * 60 * 1000, 
    sameSite: 'lax'
  },
  rolling: true 
};

module.exports = sessionConfig;
