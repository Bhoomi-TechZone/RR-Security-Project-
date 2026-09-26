import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import dns from 'dns';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import workLocationRoutes from './routes/workLocationRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';

// ===========================================
// Load Environment Variables
// ===========================================
dotenv.config();

// ===========================================
// Fix MongoDB Atlas SRV DNS Resolution
// ===========================================
// Your system's default DNS resolver is returning
// ECONNREFUSED for MongoDB SRV records.
// Use Google and Cloudflare DNS directly from Node.js.
dns.setServers(['8.8.8.8', '1.1.1.1']);

// ===========================================
// Connect to MongoDB
// Database: RR_Security
// ===========================================
connectDB();


// ===========================================
// Initialize Express App
// ===========================================
const app = express();
const PORT = process.env.PORT || 5000;


// ===========================================
// CORS Configuration
// ===========================================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {

    // Allow requests with no origin
    // (mobile apps, curl, server-to-server, etc.)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }

    // Keep existing behavior
    return callback(null, true);
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-company-id'
  ]
}));


// ===========================================
// Body Parsers
// ===========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// ===========================================
// HTTP Request Logger
// ===========================================
app.use(morgan('dev'));


// ===========================================
// Health Check Endpoint
// ===========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'NovaSpark HRMS API (RR_Security)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});


// ===========================================
// API Routes
// ===========================================

// Authentication
app.use('/api/auth', authRoutes);

// Companies
app.use('/api/companies', companyRoutes);

// Clients
app.use('/api/clients', clientRoutes);

// Employees
app.use('/api/employees', employeeRoutes);

// Work Locations
app.use('/api/work-locations', workLocationRoutes);

// Roles
app.use('/api/roles', roleRoutes);

// Shifts & Roster Management
app.use('/api/shifts', shiftRoutes);


// ===========================================
// 404 Handler
// ===========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`
  });
});


// ===========================================
// Global Error Handler
// ===========================================
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});


// ===========================================
// Start Server
// ===========================================
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`🚀 NovaSpark HRMS Backend running on port ${PORT}`);
  console.log('🗄️ Database: RR_Security (MongoDB Atlas)');
  console.log(`🔗 API Base: http://localhost:${PORT}/api/auth`);
  console.log('===========================================');
});


// ===========================================
// Export App
// ===========================================
export default app;