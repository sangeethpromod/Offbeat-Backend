import mongoose, { Schema } from 'mongoose';

const WishlistSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // one wishlist per user
      index: true,
    },

    items: [
      {
        storyId: {
          type: String,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Wishlist', WishlistSchema);
