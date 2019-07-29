const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const app = require('express')();

const firebaseConfig = {
  apiKey: 'AIzaSyDWHM957dc4Qq8aU4C2HEWS71GBYyvn-Jg',
  authDomain: 'pkfs-1950.firebaseapp.com',
  databaseURL: 'https://pkfs-1950.firebaseio.com',
  projectId: 'pkfs-1950',
  storageBucket: 'pkfs-1950.appspot.com',
  messagingSenderId: '635726540094',
  appId: '1:635726540094:web:b3ee9122fc0277b1',
};

const firebase = require('firebase');

firebase.initializeApp(firebaseConfig);
const db = admin.firestore();
const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Get workshops
app.get('/workshops', (req, res) => {
  db
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
    });
  // .catch(err => console.error(err));
});

const FBAuth = (req, res, next) => {
  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    [, idToken] = req.headers.authorization.split('Bearer ');
  } else {
    // console.error('No token found');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  admin.auth().verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      return db.collection('users').where('userId', '==', req.user.uid)
        .limit(1).get();
    })
    .then((data) => {
      req.user.email = data.docs[0].data().email;
      return next();
    })
    .catch(err => res.status(403).json(err));
};

// Create a workshop
app.post('/workshop', FBAuth, (req, res) => {
  const newWorkshop = {
    title: req.body.title,
    department: req.body.department,
    // email: req.user.email,
    createdAt: new Date().toISOString(),
  };

  db
    .collection('workshops')
    .add(newWorkshop)
    .then(doc => res.json({ message: `Document ${doc.id} created successfully` }))
    .catch((err) => {
      res.status(500).json({ error: 'Something went wrong' });
      console.log(err);
    });
});

// Validation functions
const isEmpty = str => !str.trim();
const isEmail = email => email.match(emailRegEx);

//  Signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    department: req.body.department,
    year: req.body.year,
  };

  const errors = {};
  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address';
  }

  if (isEmpty(newUser.password)) errors.password = 'Must not be empty';
  if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';

  // TODO Validate - dodaj svoju validaciju
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  let token; let
    userId;
  db.doc(`/users/${newUser.email}`).get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ email: 'This email is already taken' });
      }
      return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((responseToken) => {
      token = responseToken;
      const userCredential = {
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      return db.doc(`/users/${newUser.email}`).set(userCredential);
    })
    .then(() => res.status(201).json({ token }))
    .catch(err => res.status(500).json({ error: err.code }));
});

// Login route
app.post('/login', (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const errors = {};
  if (isEmpty(user.email)) errors.email = 'Must not be empty';
  if (isEmpty(user.password)) errors.password = 'Must not be empty';

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => data.user.getIdToken())
    .then(token => res.json({ token }))
    .catch((err) => {
      // console.error(err);
      if (err.code === 'auth/wrong-password') {
        return res.status(403).json({ general: 'Wrong credentials, please try again' });
      }
      return res.status(500).json({ error: err.code });
    });
});

exports.api = functions.region('europe-west1').https.onRequest(app);
