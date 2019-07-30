const firebase = require('firebase');
const BusBoy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { admin, db } = require('../utils/admin');
const config = require('../utils/config');

const { validateSignupData, validateLoginData } = require('../utils/validators');

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
      const userCredential = {
        email: newUser.email,
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
        const abstractUrl = `https"//firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${abstractFileName}?alt=media`;
        return db.doc(`/users/${req.user.email}`).update({ abstractUrl });
      })
      .then(() => res.json({ message: 'Abstract uploaded successfully' }))
      .catch(err => res.status(500).json({ error: err.code }));
  });
  busboy.end(req.rawBody);
};
