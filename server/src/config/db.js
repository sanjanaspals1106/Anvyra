import mongoose from 'mongoose';

// Connects to MongoDB using MONGODB_URI from the .env file.
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env and add your connection string.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host} / ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
