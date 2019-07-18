const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp();
const app = express();

app.get('/workshops', (req, res) => {
  admin
    .firestore()
    .collection('workshops')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      const workshops = [];
      data.forEach((doc) => {
        workshops.push({
          workshopID: doc.id,
          title: doc.data().title,
          department: doc.data().department,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(workshops);
    })
    .catch(err => console.error(err));
});

app.post('/workshop', (req, res) => {
  const newWorkshop = {
    title: req.body.title,
    department: req.body.department,
    createdAt: new Date().toISOString(),
  };

  admin
    .firestore()
    .collection('workshops')
    .add(newWorkshop)
    .then(doc => res.json({ message: `Document ${doc.id} created successfully` }))
    .catch((err) => {
      res.status(500).json({ error: 'Something went wrong' });
      console.log(err);
    });
});

exports.api = functions.region('europe-west1').https.onRequest(app);
