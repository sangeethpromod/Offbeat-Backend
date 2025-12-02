import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import AuthUser from '../Model/authModel';
import HostProfile from '../Model/hostModel';

dotenv.config({ path: '.env.dev' });

const createBulkHosts = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const hostsToCreate = 10;
    const password = 'password123'; // Default password for all test hosts
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating ${hostsToCreate} hosts...`);

    for (let i = 1; i <= hostsToCreate; i++) {
      const uniqueId = uuidv4().substring(0, 8);
      const randomPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

      // Create Auth User
      const authUser = new AuthUser({
        fullName: `Test Host ${i}`,
        email: `host${uniqueId}@test.com`,
        password: hashedPassword,
        role: 'host',
        isActive: true,
        phoneNumber: randomPhone,
      });

      const savedUser = await authUser.save();

      // Create Host Profile
      const locations = [
        'Mumbai',
        'Delhi',
        'Bangalore',
        'Goa',
        'Kerala',
        'Manali',
        'Rishikesh',
        'Jaipur',
      ];
      const randomLocation =
        locations[Math.floor(Math.random() * locations.length)];
      const randomAadhar = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      const hostProfile = new HostProfile({
        userId: savedUser.userId,
        age: 25 + Math.floor(Math.random() * 30),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        mobileNumber: randomPhone,
        nationality: 'Indian',
        location: randomLocation,
        aadharNumber: randomAadhar,
        onboardingStep: 3,
        isOnboardingComplete: true,
        isEmailVerified: true,
        status: 'PENDING', // Set status to PENDING for newly created hosts
      });

      await hostProfile.save();
      console.log(
        `✅ Created Host ${i}: ${savedUser.email} (${savedUser.fullName})`
      );
    }

    console.log('\n🎉 Successfully created 10 hosts!');
    console.log('Default password: password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating hosts:', error);
    process.exit(1);
  }
};

createBulkHosts();

// // the comment to run the bulk
// npx ts-node src/scripts/bulkHost.ts
