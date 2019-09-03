const functions = require('firebase-functions');
const app = require('express')();
const cors = require('cors');
const FBAuth = require('./utils/fbAuth');

app.use(cors());

// const { db } = require('./utils/admin');

// const {
//   getAllWorkshops,
//   postOneWorkshop,
//   getWorkshop,
//   commentOnWorkshop,
//   applyToWorkshop,
//   unapplyToWorkshop,
//   deleteWorkshop,
// } = require('./handlers/workshops');
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
// app.get('/workshops', getAllWorkshops);
// app.post('/workshop', FBAuth, postOneWorkshop);
// app.get('/workshop/:workshopId', getWorkshop);
// app.delete('/workshop/:workshopId', FBAuth, deleteWorkshop); // ?
// app.get('/workshop/:workshopId/apply', FBAuth, applyToWorkshop);
// app.get('/workshop/:workshopId/unapply', FBAuth, unapplyToWorkshop); // ?

// app.post('/workshop/:workshopId/comment', FBAuth, commentOnWorkshop); // ?

// Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/abstract', FBAuth, uploadAbstract);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:email', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

// exports.createNotificationOnApply = functions.region('europe-west1').firestore.document('applications/{id}')
//   .onCreate(snapshot => db.doc(`/workshops/${snapshot.data().workshopId}`).get()
//     .then((doc) => {
//       if (doc.exists) { // && doc.data().email !== snapshot.data().email
//         return db.doc(`/notifications/${snapshot.id}`).set({
//           createdAt: new Date().toISOString(),
//           recipient: doc.data().email,
//           sender: snapshot.data().email,
//           type: 'application',
//           read: false,
//           workshopId: doc.id,
//         });
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//     }));

// exports.deleteNotificationOnApply = functions.region('europe-west1').firestore.document('applications/{id}')
//   .onDelete(snapshot => db.doc(`/notifications/${snapshot.data().workshopId}`).delete()
//     .catch((err) => {
//       console.error(err);
//     }));

// exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
//   .onCreate(snapshot => db.doc(`/workshops/${snapshot.data().workshopId}`).get()
//     .then((doc) => {
//       if (doc.exists) { // && doc.data().email !== snapshot.data().email
//         return db.doc(`/notifications/${snapshot.id}`).set({
//           createdAt: new Date().toISOString(),
//           recipient: doc.data().email,
//           sender: snapshot.data().email,
//           type: 'comment',
//           read: false,
//           workshopId: doc.id,
//         });
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//     }));

/*
exports.onUserImageChange = functions.region('europe-west1').firestore.document('/user/{userId}')
  .onUpdate(change => {
    if(change.before.data().imageUrl !== change.after.data().imageUrl) {
      let batch = db.batch();
      return db.collection('workshops').where('email', '==', change.before.data().email).get()
        .then(data => {
          const workshops = db.doc(`/workshops/${doc.id}`);
          batch.update(workshops, { userImage: change.after.data().imageUrl});
        })
      return batch.commit();
    }
  })
*/

// exports.onWorkshopDelete = functions.region('europe-west1').firestore.document('/workshops/{workshopId}')
//   .onDelete((snapshot, context) => {
//     const workshopId = context.params.workshopId;
//     const batch = db.batch();
//     return db.collection('comments').where('workshopId', '==', workshopId).get()
//       .then((data) => {
//         data.forEach((doc) => {
//           batch.delete(db.doc(`/comments/${doc.id}`));
//         });
//         return db.collection('applications').where('workshopId', '==', workshopId).get();
//       })
//       .then((data) => {
//         data.forEach((doc) => {
//           batch.delete(db.doc(`/applications/${doc.id}`));
//         });
//         return db.collection('notifications').where('workshopId', '==', workshopId).get();
//       })
//       .then((data) => {
//         data.forEach((doc) => {
//           batch.delete(db.doc(`/notifications/${doc.id}`));
//         });
//         return batch.commit();
//       })
//       .catch((err) => { console.error(err); });
//   });
