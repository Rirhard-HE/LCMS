
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const connectDB = require('../config/db'); 

let mongod;

exports.mochaHooks = {
  
  async beforeAll() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

    await connectDB();
  },

  
  async afterAll() {
    if (mongoose.connection.readyState) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
};
