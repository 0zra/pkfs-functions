const firebase = require('firebase');
const BusBoy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { admin, db } = require('../utils/admin');
const config = require('../utils/config');

const { validateSignupData, validateLoginData, reduceUserDetails } = require('../utils/validators');

firebase.initializeApp(config);

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    department: req.body.department,
    // imageUrl: `https"//firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
    year: req.body.year,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(403).json(errors);

  // const noImg = 'no-img.png';

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
      const {
        firstName, lastName, department, year, email,
      } = newUser;
      const userCredential = {
        firstName,
        lastName,
        email,
        code: department + year,
        createdAt: new Date().toISOString(),
        userId,
      };
      return db.doc(`/users/${newUser.email}`).set(userCredential);
    })
    .then(() => res.status(201).json({ token }))
    .catch(err => res.status(500).json({ error: err.code }));
  return null;
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(403).json(errors);

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
  return null;
};
// Get any user's details: i cemo ovako povezat applikacije, umisto workshopa
exports.getUserDetails = (req, res) => {
  const userData = {};
  db.doc(`/users/${req.params.email}`).get()
    .then((doc) => {
      if (doc.exists) {
        userData.user = doc.data();
        return db.collection('workshops').where('email', '==', req.params.email)
          .orderBy('createdAt', 'desc').get();
      }
      return res.status(404).json({ error: 'User not found' });
    })
    .then((data) => {
      userData.workshops = [];
      data.forEach((doc) => {
        userData.workshops.push({
          title: doc.data().title,
          createdAt: doc.data().createdAt,
          email: doc.data().email,
          department: doc.data().department,
          applicationsCount: doc.data().applicationsCount,
          commentsCount: doc.data().commentsCount,
          workshopId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch(err => res.status(500).json({ error: err.code }));
};

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  const userData = {};
  console.log(req.user);
  db.doc(`/users/${req.user.email}`).get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db.collection('applications').where('email', '==', req.user.email).get();
      }
    })
    .then((data) => {
      userData.applications = [];
      data.forEach(
        (doc) => { userData.applications.push(doc.data()); },
      );
      return db.collection('notifications').where('recipient', '==', req.user.email)
        .orderBy('createdAt', 'desc').limit(10)
        .get();
    })
    .then((data) => {
      userData.notifications = [];
      data.forEach((doc) => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          dender: doc.data().dender,
          createdAt: doc.data().createdAt,
          workshopId: doc.data().workshopId,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch(err => res.status(500).json({ error: err.code }));
};

// Add user details, vid no. 9.
exports.addUserDetails = (req, res) => {
  const userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.email}`).update(userDetails)
    .then(() => res.json({ message: 'Details added successfully' }))
    .catch(err => res.status(500).json({ error: err.code }));
};

exports.uploadAbstract = (req, res) => {
  const busboy = new BusBoy({ headers: req.headers });

  let abstractFileName;
  let abstractToBeUploaded = {};


  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    // Napravi validator za ms word
    if (mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Wrong file type submitted' });
    }
    const abstractExtension = filename.split('.').slice(-1)[0];

    abstractFileName = `${Math.round(Math.random() * 100000000000)}.${abstractExtension}`;
    const filepath = path.join(os.tmpdir(), abstractFileName);

    abstractToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin.storage().bucket().upload(abstractToBeUploaded.filepath, {
      resumable: false,
      metadata: {
        contentType: abstractToBeUploaded.mimetype,
      },
    })
      .then(() => {
        const abstractUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${abstractFileName}?alt=media`;
        return db.doc(`/users/${req.user.email}`).update({ abstractUrl });
      })
      .then(() => res.json({ message: 'Abstract uploaded successfully' }))
      .catch(err => res.status(500).json({ error: err.code }));
  });
  busboy.end(req.rawBody);
};

exports.markNotificationsRead = (req, res) => {
  const batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch.commit()
    .then(() => res.json({ message: 'Notification marked read' }))
    .catch(err => res.status(500).json({ error: err.code }));
};
