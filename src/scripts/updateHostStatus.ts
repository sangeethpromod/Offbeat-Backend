// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import HostProfile from '../Model/hostModel';

// dotenv.config({ path: '.env.dev' });

// const updateAllHostsToPending = async () => {
//   try {
//     const mongoUri = process.env.MONGODB_URI;
//     if (!mongoUri) {
//       throw new Error('MONGODB_URI is not defined in environment variables');
//     }

//     await mongoose.connect(mongoUri);
//     console.log('Connected to MongoDB');

//     console.log('Updating all hosts to PENDING status...');

//     // Update all host profiles to have status PENDING
//     const result = await HostProfile.updateMany(
//       {}, // Empty filter to match all documents
//       { $set: { status: 'PENDING' } }
//     );

//     console.log(
//       `✅ Successfully updated ${result.modifiedCount} hosts to PENDING status`
//     );
//     console.log(`Total hosts matched: ${result.matchedCount}`);

//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error updating host status:', error);
//     process.exit(1);
//   }
// };

// updateAllHostsToPending();

// // To run this script:
// // npx ts-node src/scripts/updateHostStatus.ts
