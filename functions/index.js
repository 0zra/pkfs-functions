const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./utils/fbAuth');

const { getAllWorkshops, postOneWorkshop, getWorkshop } = require('./handlers/workshops');
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
app.get('/workshop/:workshopId', getWorkshop);
// TODO: delete a workshop
// TODO: apply for a workshop
// TODO: unapply for a workshop(?)
// TODO: comment on a workshop (vidit cemo za ovo)

// Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/abstract', FBAuth, uploadAbstract);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.region('europe-west1').https.onRequest(app);
