console.log('🚀 Starting working server...');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

console.log('1️⃣ Loading environment...');
dotenv.config();
console.log('✅ Environment loaded');

console.log('2️⃣ Creating Express app...');
const app = express();
console.log('✅ Express app created');

console.log('3️⃣ Setting up middleware...');
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log('✅ Middleware configured');

console.log('4️⃣ Setting up basic routes...');
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CareConnect Backend API'
  });
});

// Simple test auth route without Firebase
app.post('/api/auth/test', (req, res) => {
  res.json({ 
    message: 'Auth endpoint working',
    body: req.body 
  });
});

console.log('✅ Basic routes added');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});
console.log('✅ 404 handler added');

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});
console.log('✅ Error handler added');

console.log('5️⃣ Starting server...');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 CareConnect Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Test auth: http://localhost:${PORT}/api/auth/test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

console.log('🏁 Server setup complete');
