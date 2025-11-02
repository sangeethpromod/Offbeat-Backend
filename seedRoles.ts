import dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });

import mongoose from 'mongoose';
import Role from './src/Model/roleModel';

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/offbeat-backend'
    );
    console.log('Connected to MongoDB');

    // Check if roles already exist
    const existingRoles = await Role.find();
    if (existingRoles.length > 0) {
      console.log('Roles already exist in the database');
      console.log(
        'Existing roles:',
        existingRoles.map(role => ({
          name: role.roleName,
          status: role.roleStatus,
        }))
      );
      return;
    }

    // Create default roles
    const roles = [
      {
        roleName: 'traveller',
        roleStatus: 'ACTIVE',
      },
      {
        roleName: 'host',
        roleStatus: 'ACTIVE',
      },
    ];

    // Insert roles
    const createdRoles = await Role.insertMany(roles);
    console.log('Roles seeded successfully:');
    createdRoles.forEach(role => {
      console.log(
        `- ${role.roleName} (${role.roleStatus}) - ID: ${role.roleId}`
      );
    });
  } catch (error) {
    console.error('Error seeding roles:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedRoles();
