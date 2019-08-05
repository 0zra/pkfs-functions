let db = {
    workshops: [
        {
            title: "naslov",
            med: true,
            pharm: false,
            dent: false,
            createdAt: "2019-03-15T11:46:01.018Z",
            maxAttendees: 20,
            email: 'petar.ozretic@gmail.com',
            applicationsCount: 7,
            yearsAndDepartments: ['MED1', 'MED2'],
            commentsCount: 0, // vj beskorisno
            // opis, predavac?
        }
    ],
    users: [
        {
            "lastName": "Zadnje ime",
            "firstName": "Prvo Ime",
            "code": "med7",
            "website": "http://gfny.cc",
            "abstractUrl": "https://firebasestorage.googleapis.com/v0/b/pkfs-1950.appspot.com/o/4078295670.pdf?alt=media",
            "email": "petar.ozretic@gmail.com",
            "userId": "NoSMLUTRgLdOQowmw6c9pQ5lQ8Y2",
            "bio": "Tu pise moj zivotopis",
            "createdAt": "2019-08-05T14:02:43.925Z",
            "location": "Split, Croatia"
        }
    ]
}
title: req.body.title,
    med: req.body.med,
    pharm: req.body.pharm,
    dent: req.body.dent,
    email: req.user.email,
    createdAt: new Date().toISOString(),
    applicationsCount: 0,
    maxAtendees: req.body.maxAtendees,
    commentsCount: 0, // vj beskorisno