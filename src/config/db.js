import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

/**
 * Initializes and connects to an in-memory MongoDB instance.
 * This is useful for zero-setup execution and testing.
 */
export const connectDB = async () => {
  try {
    // Spin up the in-memory mongodb instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect mongoose to the in-memory URI
    await mongoose.connect(uri);
    console.log(`MongoDB successfully connected to in-memory server: ${uri}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnects from the database and stops the in-memory server.
 */
export const disconnectDB = async () => {
  if (mongoose.connection) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};
