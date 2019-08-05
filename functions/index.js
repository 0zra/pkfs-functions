const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./utils/fbAuth');

const { db } = require('./utils/admin');

const {
  getAllWorkshops,
  postOneWorkshop,
  getWorkshop,
  commentOnWorkshop,
  applyToWorkshop,
  unapplyToWorkshop,
  deleteWorkshop,
} = require('./handlers/workshops');
const {
  signup,
  login,
  uploadAbstract,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require('./handlers/users');

// Workshop routes
app.get('/workshops', getAllWorkshops);
app.post('/workshop', FBAuth, postOneWorkshop);
app.get('/workshop/:workshopId', getWorkshop);
app.delete('/workshop/:workshopId', FBAuth, deleteWorkshop); // ?
app.get('/workshop/:workshopId/apply', FBAuth, applyToWorkshop);
app.get('/workshop/:workshopId/unapply', FBAuth, unapplyToWorkshop); // ?

app.post('/workshop/:workshopId/comment', FBAuth, commentOnWorkshop); // ?

// Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/abstract', FBAuth, uploadAbstract);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:email', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnApply = functions.region('europe-west1').firestore.document('applications/{id}')
  .onCreate((snapshot) => {
    db.doc(`/workshops/${snapshot.data().workshopId}`).get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().email,
            sender: snapshot.data().email,
            type: 'application',
            read: false,
            workshopId: doc.id,
          });
        }
      })
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnApply = functions.region('europe-west1').firestore.document('applications/{id}')
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.data().workshopId}`).delete()
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
  });

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    db.doc(`/workshops/${snapshot.data().workshopId}`).get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().email,
            sender: snapshot.data().email,
            type: 'comment',
            read: false,
            workshopId: doc.id,
          });
        }
      })
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
  });
