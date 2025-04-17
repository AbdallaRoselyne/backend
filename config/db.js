const mongoose = require('mongoose');

const connectDB = async () => {
  // Fallback URI for development
  const defaultUri = "mongodb+srv://farahnaz:%40Roselyne44@project-planner.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";
  
  const connectionUri = process.env.MONGO_URI || defaultUri;

  console.log('🔗 Attempting to connect with URI:', 
    connectionUri.includes('@') 
      ? connectionUri.replace(/^(.*?:\/\/)([^:]+:[^@]+@)/, '$1<credentials>') 
      : connectionUri
  );

  try {
    await mongoose.connect(connectionUri);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;