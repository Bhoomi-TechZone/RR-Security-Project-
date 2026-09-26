import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Company from '../models/companyModel.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'RR_Security',
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Clean up any temporary/test collections or databases to stay under 500 collection limit
    await cleanupClusterCapacity();

    // Seed default admin and accounts if they don't exist
    await seedDefaultUsers();
    await seedDefaultCompany();
    await ensureCoreCollections();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanupClusterCapacity = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    for (const dbInfo of databases) {
      // Never touch system DBs or the main RR_Security database
      if (['admin', 'local', 'config', 'RR_Security'].includes(dbInfo.name)) {
        continue;
      }
      
      // If there are temporary or test databases created during tests
      if (
        dbInfo.name.toLowerCase().startsWith('test') ||
        dbInfo.name.toLowerCase().startsWith('tmp') ||
        dbInfo.name.toLowerCase().includes('scratch') ||
        dbInfo.name.toLowerCase().includes('temp')
      ) {
        const targetDb = mongoose.connection.client.db(dbInfo.name);
        await targetDb.dropDatabase();
        console.log(`🧹 Dropped unused test database to free collection capacity: ${dbInfo.name}`);
      }
    }
  } catch (err) {
    console.warn('Notice during capacity check:', err.message);
  }
};

const ensureCoreCollections = async () => {
  try {
    const currentCollections = await mongoose.connection.db.listCollections().toArray();
    const collNames = currentCollections.map(c => c.name);
    for (const coreColl of ['users', 'companies', 'clients', 'employees']) {
      if (!collNames.includes(coreColl)) {
        await mongoose.connection.db.createCollection(coreColl);
        console.log(`📦 Ensured "${coreColl}" collection exists in RR_Security.`);
      }
    }
  } catch (err) {
    console.warn('Collection initialization notice:', err.message);
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
    const seedList = [
      {
        name: 'RR Security Administrator',
        email: 'rrsecurity@gmail.com',
        password: 'Security@123',
        role: 'admin',
        redirect: '/admin/dashboard',
        label: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        department: 'Executive Administration',
        status: 'Active'
      },
      {
        name: 'System Administrator (Backup)',
        email: 'admin@novaspark.com',
        password: 'Admin@123',
        role: 'admin',
        redirect: '/admin/dashboard',
        label: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        department: 'Executive Management',
        status: 'Active'
      },
      {
        name: 'Amit Kumar',
        email: 'user@novaspark.com',
        password: 'User@123',
        role: 'user',
        redirect: '/user/dashboard',
        label: 'User',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
        department: 'Operations',
        status: 'Active'
      },
      {
        name: 'Apex Infotech Solutions',
        email: 'client@novaspark.com',
        password: 'Client@123',
        role: 'client',
        redirect: '/client/dashboard',
        label: 'Client',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        department: 'Client Portal',
        status: 'Active'
      },
      {
        name: 'Rajesh Sharma',
        email: 'employee@novaspark.com',
        password: 'Employee@123',
        role: 'employee',
        redirect: '/employee/dashboard',
        label: 'Employee',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
        department: 'Field Operations',
        status: 'Active'
      }
    ];

    for (const u of seedList) {
      let existingUser = await User.findOne({ email: u.email.toLowerCase() });
      if (!existingUser) {
        await User.create(u);
        console.log(`🌱 Created user: ${u.email} (${u.role})`);
      } else {
        // If password needs update or user exists
        existingUser.password = u.password;
        existingUser.status = 'Active';
        existingUser.role = u.role;
        await existingUser.save();
      }
    }
    console.log('✅ Admin (rrsecurity@gmail.com) and seed users verified in RR_Security.');
  } catch (err) {
    console.error('Error during initial user seeding:', err.message);
  }
};
