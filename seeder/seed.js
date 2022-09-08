const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const database = require("./database");
const User = require("../models/user");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
});

const dbSeeder = async () => {
  await User.deleteMany({});
  await User.insertMany(database);
};

dbSeeder().then(() => {
  mongoose.connection.close();
});
