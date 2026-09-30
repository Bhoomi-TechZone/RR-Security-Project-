import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Company from '../models/companyModel.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'RR_Security',
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Seed default admin and accounts if they don't exist
    await seedDefaultUsers();
    await seedDefaultCompany();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedDefaultCompany = async () => {
  try {
    const existing = await Company.findOne({
      $or: [
        { companyId: 'RRS8392014SEC' },
        { isDefault: true },
        { name: 'RR Security' }
      ]
    });
    if (!existing) {
      await Company.create({
        companyId: 'RRS8392014SEC',
        name: 'RR Security',
        code: 'RRS',
        industry: 'Security & Facility Management',
        email: 'rrsecurity@gmail.com',
        phone: '+91 9876543210',
        address: 'Civil Lines, Bareilly, Uttar Pradesh 243001',
        city: 'Bareilly',
        state: 'Uttar Pradesh',
        pinCode: '243001',
        gstin: '09ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        tan: 'BLRA12345D',
        adminEmail: 'rrsecurity@gmail.com',
        isDefault: true,
        status: 'Active'
      });
      console.log('🌱 Seeded default primary company: RR Security (RRS8392014SEC)');
    }
  } catch (err) {
    console.error('Error during company seeding:', err.message);
  }
};

const seedDefaultUsers = async () => {
  try {
    const adminAccount = {
      name: 'RR Security Administrator',
      email: 'rrsecurity@gmail.com',
      password: 'Security@123',
      role: 'admin',
      redirect: '/admin/dashboard',
      label: 'Admin',
      department: 'Executive Administration',
      status: 'Active'
    };

    let existingAdmin = await User.findOne({ email: adminAccount.email.toLowerCase() });
    if (!existingAdmin) {
      await User.create(adminAccount);
      console.log(`🌱 Verified Master Admin: ${adminAccount.email}`);
    }
  } catch (err) {
    console.error('Error during initial admin verification:', err.message);
  }
};
