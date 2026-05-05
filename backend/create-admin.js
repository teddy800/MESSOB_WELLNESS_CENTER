const { prisma } = require('./dist/config/prisma.js');
const bcrypt = require('bcryptjs');

async function createSystemAdmin() {
  try {
    console.log('🔍 Checking for existing system admin...');
    
    // Check if system admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'SYSTEM_ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ System admin already exists:', existingAdmin.email);
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.fullName);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('✅ Active:', existingAdmin.isActive);
      console.log('🔐 Can Login:', existingAdmin.canLogin);
      return;
    }

    console.log('🚀 Creating system admin user...');

    // Create system admin with strong password
    const adminEmail = 'admin@mesob.et';
    const adminPassword = 'Admin123!@#'; // Strong password that meets all requirements
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'SYSTEM_ADMIN',
        isActive: true,
        canLogin: true,
      }
    });

    // Create health profile for the admin
    await prisma.healthProfile.create({
      data: {
        userId: admin.id,
      }
    });

    console.log('✅ System admin created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', admin.fullName);
    console.log('🔑 Role:', admin.role);
    console.log('');
    console.log('🚨 IMPORTANT: Please save these credentials securely!');
    console.log('🚨 Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating system admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSystemAdmin();