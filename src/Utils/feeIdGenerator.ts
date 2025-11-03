import mongoose, { Schema } from 'mongoose';

const PREFIX = 'ofb-feestrcut-';
const PAD = 3; // e.g., 001, 002

type CounterDoc = {
  _id: string;
  seq: number;
};

// Define a tiny Counter model using Mongoose to ensure we always get the UPDATED doc
const CounterSchema = new Schema<CounterDoc>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  (mongoose.models.Counter as mongoose.Model<CounterDoc>) ||
  mongoose.model<CounterDoc>('Counter', CounterSchema, 'counters');

/**
 * Atomically increments a named counter in the 'counters' collection
 * and returns the next sequence number.
 */
async function getNextSequence(name: string): Promise<number> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }

  // Use Mongoose findOneAndUpdate to guarantee the updated document is returned
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  const seq = doc?.seq ?? 1;
  return seq;
}

/**
 * Generates a feeId like 'ofb-feestrcut-001', 'ofb-feestrcut-002', ...
 */
export async function generateFeeId(): Promise<string> {
  const seq = await getNextSequence('feeId');
  const padded = String(seq).padStart(PAD, '0');
  return `${PREFIX}${padded}`;
}
