const mongoose = require('mongoose');

const connectDB = async () => {
  // If already connected (serverless warm instance), skip reconnecting
  if (mongoose.connection.readyState === 1) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('Connected to Database...');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    // Do NOT call process.exit(1) in serverless — it kills the function
    // before CORS headers can be sent, causing a browser "CORS error".
    // Throw instead so the route handler can return a proper 503 JSON response.
    throw error;
  }
};

module.exports = connectDB;