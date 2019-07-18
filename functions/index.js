const functions = require('firebase-functions');
const admin = require('firebase-admin');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

admin.initializeApp();

exports.helloWorld = functions.https.onRequest((request, response) => response.send('Hello world'));

exports.getWorkshops = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('workshops')
    .get()
    .then((data) => {
      const workshops = [];
      data.forEach((doc) => {
        workshops.push(doc.data());
      });
      return res.json(workshops);
    })
    .catch(err => console.error(err));
});

exports.createWorkshop = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({ error: 'Method not allowed!' });
  }
  const newWorkshop = {
    title: req.body.title,
    department: req.body.department,
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
  };

  admin
    .firestore()
    .collection('workshops')
    .add(newWorkshop)
    .then(doc => res.json({ message: `Document ${doc.id} created successfully` }))
    .catch((err) => {
      res.status(500), json({ error: 'Something went wrong' });
      console.log(err);
    });
});
