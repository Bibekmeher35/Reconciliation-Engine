import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Connects to MongoDB Atlas using the URI provided in environment variables.
 * This replaces the previous in-memory server for production use.
 */
export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in the .env file.");
    }

    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure if DB connection is essential
    process.exit(1);
  }
};

/**
 * Disconnects from the database.
 */
export const disconnectDB = async () => {
  if (mongoose.connection) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};
