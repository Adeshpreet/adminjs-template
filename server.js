// Requirements
const mongoose = require("mongoose");
const express = require("express");
const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const bcrypt = require("bcrypt");
const User = require("./models/user");

// We have to tell AdminJS that we will manage mongoose resources with it
AdminJS.registerAdapter(require("@adminjs/mongoose"));

// express server definition
const app = express();
app.use(express.json());
require("dotenv").config();

// RBAC functions
const canModifyUsers = ({ currentAdmin }) =>
  currentAdmin && currentAdmin.role === "admin";

// Pass all configuration settings to AdminJS
const adminJs = new AdminJS({
  resources: [
    {
      resource: User,
      options: {
        properties: {
          encryptedPassword: { isVisible: false },
          password: {
            type: "string",
            isVisible: {
              list: false,
              edit: true,
              filter: false,
              show: false,
            },
          },
        },
        actions: {
          new: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload = {
                  ...request.payload,
                  encryptedPassword: await bcrypt.hash(
                    request.payload.password,
                    10
                  ),
                  password: undefined,
                };
              }
              return request;
            },
          },
          edit: { isAccessible: canModifyUsers },
          delete: { isAccessible: canModifyUsers },
        },
      },
    },
  ],
  branding: {
    companyName: "HestaBit",
    logo: "https://1z1euk35x7oy36s8we4dr6lo-wpengine.netdna-ssl.com/wp-content/uploads/2021/11/Hestabit-Logo.jpg",
    favicon: "https://d3od5zqo51695m.cloudfront.net/images/favicon.png",
  },
  locale: {
    translations: {
      labels: {
        loginWelcome: "Welcome to HestaBit",
      },
      messages: {
        loginWelcome:
          "Please login with your credentials to access Admin services.",
      },
    },
  },
  rootPath: "/",
});

// Build and use a router which will handle all AdminJS routes
const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
  authenticate: async (email, password) => {
    const user = await User.findOne({ email });
    if (user) {
      const matched = await bcrypt.compare(password, user.encryptedPassword);
      if (matched) {
        return user;
      }
    }
    return false;
  },
  cookiePassword: "12345678",
});

app.use(adminJs.options.rootPath, router);

// Simple hello page request
app.get("/hello", async function (req, res) {
  res.send("Hello");
});

// Running the server
const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
  });
  await app.listen(process.env.PORT, () =>
    console.log(`Example app listening on http://localhost:${process.env.PORT}`)
  );
};

run();
