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
  };

  db
    .collection('workshops')
    .add(newWorkshop)
    .then(doc => res.json({ message: `Document ${doc.id} created successfully` }))
    .catch((err) => {
      res.status(500).json({ error: 'Something went wrong' });
      console.log(err);
    });
};
