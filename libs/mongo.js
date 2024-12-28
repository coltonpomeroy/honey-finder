import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

let client;
let clientPromise;

if (!uri) {
  console.group("⚠️ MONGODB_URI missing from .env");
  console.error("Database connection URI is required for authentication");
  console.error("Please add MONGODB_URI to your environment variables");
  console.groupEnd();
  throw new Error("Please add MONGODB_URI to environment variables");
} 

// Add debug logging in production
if (process.env.NODE_ENV === "production") {
  console.log("Attempting MongoDB connection...");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log(`MongoDB Connected: ${client.db().databaseName}`);
        return client;
      })
      .catch(error => {
        console.error("MongoDB connection error:", error);
        throw error;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log(`MongoDB Connected: ${client.db().databaseName}`);
      return client;
    })
    .catch(error => {
      console.error("MongoDB connection error:", error);
      throw error;
    });
}

export default clientPromise;