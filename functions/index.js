const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./utils/fbAuth');

const { getAllWorkshops, postOneWorkshop } = require('./handlers/workshops');
const {
  signup,
  login,
  uploadAbstract,
  addUserDetails,
  getAuthenticatedUser,
} = require('./handlers/users');

// Workshop routes
app.get('/workshops', getAllWorkshops);
app.post('/workshop', FBAuth, postOneWorkshop);

// Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/abstract', FBAuth, uploadAbstract);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.region('europe-west1').https.onRequest(app);
