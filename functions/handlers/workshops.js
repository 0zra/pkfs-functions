const { db } = require('../utils/admin');

exports.getAllWorkshops = (req, res) => {
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
    })
    .catch(err => console.error(err));
};

exports.postOneWorkshop = (req, res) => {
  const newWorkshop = {
    title: req.body.title,
    department: req.body.department,
    // email: req.user.email,
    createdAt: new Date().toISOString(),
    applicationsCount: 0,
    commentsCount: 0, // vj beskorisno
  };

  db
    .collection('workshops')
    .add(newWorkshop)
    .then((doc) => {
      const resWorkshop = newWorkshop;
      resWorkshop.workshopId = doc.id;
      res.json(resWorkshop);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Something went wrong' });
      console.log(err);
    });
};

exports.getWorkshop = (req, res) => {
  let workshopData = {};
  db.doc(`/workshops/${req.params.workshopId}`).get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Workshop not found' });
      }
      workshopData = doc.data();
      workshopData.workshopId = doc.id;
      return db.collection('comments')
        .orderBy('createdAt', 'desc')
        .where('workshopId', '==', req.params.workshopId).get();
    })
    .then((data) => {
      workshopData.comments = [];
      data.forEach((doc) => { workshopData.comments.push(doc.data()); });

      return res.json(workshopData);
    })
    .catch((err) => { res.status(500).json({ error: err.code }); });
};

exports.commentOnWorkshop = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ error: 'Must not be empty' });
  }
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    workshopId: req.params.workshopId,
    email: req.user.email,
  };

  db.doc(`/workshops/${req.params.workshopId}`).get()
    .then((doc) => {
      if (!doc.exists) { return res.status(404).json({ error: 'Workshop not found' }); }
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => { res.status(500).json({ error: err.code }); });
};

exports.applyToWorkshop = (req, res) => {
  const applicationDocument = db.collection('applications').where('email', '==', req.user.email)
    .where('workshopId', '==', req.params.workshopId).limit(1);

  const workshopDocument = db.doc(`/workshops/${req.params.workshopId}`);

  let workshopData;

  workshopDocument.get()
    .then((doc) => {
      if (doc.exists) {
        workshopData = doc.data();
        workshopData.workshopId = doc.id;
        return applicationDocument.get();
      }
      return res.status(404).json({ error: 'Workshop not found' });
    })
    .then((data) => {
      if (data.empty) {
        return db.collection('applications').add({
          workshopId: req.params.workshopId,
          email: req.user.email,
        })
          .then(() => {
            workshopData.applicationsCount++;
            return workshopDocument.update({ applicationsCount: workshopData.applicationsCount });
          })
          .then(() => res.json(workshopData));
      }
      return res.status(400).json({ error: 'Already applied to this workshop' });
    })
    .catch((err) => { res.status(500).json({ error: err.code }); });
};

exports.unapplyToWorkshop = (req, res) => {
  const applicationDocument = db.collection('applications').where('email', '==', req.user.email)
    .where('workshopId', '==', req.params.workshopId).limit(1);

  const workshopDocument = db.doc(`/workshops/${req.params.workshopId}`);

  let workshopData;

  workshopDocument.get()
    .then((doc) => {
      if (doc.exists) {
        workshopData = doc.data();
        workshopData.workshopId = doc.id;
        return applicationDocument.get();
      }
      return res.status(404).json({ error: 'Workshop not found' });
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'Already applied to this workshop' });
      }
      return db.doc(`/applications/${data.docs[0].id}`).delete()
        .then(() => {
          workshopData.applicationsCount--;
          return workshopDocument.update({ applicationsCount: workshopData.applicationsCount });
        })
        .then(() => res.json(workshopData));
    })
    .catch((err) => { res.status(500).json({ error: err.code }); });
};
