const { admin, db } = require('./admin');

module.exports = (req, res, next) => {
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
  return null;
};
