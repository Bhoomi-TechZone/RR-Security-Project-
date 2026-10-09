import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import dns from 'dns';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import clientPortalRoutes from './routes/clientPortalRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import workLocationRoutes from './routes/workLocationRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import statutoryRoutes from './routes/statutoryRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import reimbursementRoutes from './routes/reimbursementRoutes.js';
import advanceLoanRoutes from './routes/advanceLoanRoutes.js';
import payrollSetupRoutes from './routes/payrollSetupRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

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
const PORT = process.env.PORT;


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
    'x-company-id',
    'x-client-id',
    'x-employee-id',
    'x-user-id',
    'x-requested-with',
    'Accept',
    'Origin'
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
// Health Check & Collections Status Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'NovaSpark HRMS API (RR_Security)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/collections-status', async (req, res) => {
  try {
    import('mongoose').then(async ({ default: mongoose }) => {
      if (!mongoose.connection.db) {
        return res.status(500).json({ success: false, message: 'Database not connected yet.' });
      }
      const collections = await mongoose.connection.db.listCollections().toArray();
      const stats = [];
      for (const coll of collections) {
        const count = await mongoose.connection.db.collection(coll.name).countDocuments();
        stats.push({ collection: coll.name, count });
      }
      return res.status(200).json({
        success: true,
        database: mongoose.connection.name,
        totalCollections: collections.length,
        collections: stats
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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

// Client Portal (Dynamic Client Dashboard, Assigned Employees, Attendance, Invoices, Profile)
app.use('/api/client-portal', clientPortalRoutes);

// Employees
app.use('/api/employees', employeeRoutes);

// Work Locations
app.use('/api/work-locations', workLocationRoutes);

// Roles
app.use('/api/roles', roleRoutes);

// Users (HRMS Login Users / System Users)
app.use('/api/users', userRoutes);

// Shifts & Roster Management
app.use('/api/shifts', shiftRoutes);

// Attendance Management
app.use('/api/attendance', attendanceRoutes);

// Leave Management
app.use('/api/leaves', leaveRoutes);

// Inventory & Uniform / Asset Management
app.use('/api/inventory', inventoryRoutes);

// Company Preferences (Employee Portal, Manager Permissions, etc.)
app.use('/api/preferences', preferenceRoutes);

// Dynamic Masters (Banks, Departments, Designations, Sites, etc. with Company Isolation)
app.use('/api/masters', masterRoutes);

// Dynamic Dashboard Statistics & Analytics
app.use('/api/dashboard', dashboardRoutes);

// Dynamic Announcements (Targeted to All, Clients, Employees)
app.use('/api/announcements', announcementRoutes);

// Statutory Setup & Compliance Rules (PF, ESI, PT, TDS, Bonus, Gratuity, LWF in MongoDB)
app.use('/api/statutory', statutoryRoutes);

// Dynamic Payroll Engine (Calculations, Runs, Approvals, Slips, Revisions, Arrears)
app.use('/api/payroll', payrollRoutes);

// Dynamic Reimbursement Management (Claims, Expense Types, Approvals, Payments)
app.use('/api/reimbursements', reimbursementRoutes);

// Dynamic Advance & Loan Management (Requests, Approvals, EMIs, Schedules, History)
app.use('/api/advances-loans', advanceLoanRoutes);

// Dynamic Payroll Setup (Pay Groups, Schedules, Cycles, Pay Days, Calculation Methods)
app.use('/api/payroll-setup', payrollSetupRoutes);

// Dynamic System & Activity Notifications (Assets, Uniforms, Reimbursements, Loans, Leaves)
app.use('/api/notifications', notificationRoutes);


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