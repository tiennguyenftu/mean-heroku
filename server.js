var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = 'contacts';

var app = express();
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json());

//Create a database variable outside of the database connection callback to reuse the connection in your app
var db;

//Connect to the database before starting the application server
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    //Save database object from the callback for reuse
    db = database;
    console.log('Database connection ready');

    //Initialize the app
    var server = app.listen(process.env.PORT || 3000, function () {
        var port = server.address().port;
        console.log('Server is running on port ' + port);
    });
});

app.get('/', function (req, res) {
    res.send('Welcome to my Contact app');
});

//CONTACT API ROUTES

//generic error handler
function handleError(res, reason, message, code) {
    console.log('ERROR: ' + reason);
    return res.status(code || 500).json({'error': message});
}

// '/contacts'
// GET: finds all contacts
// POST: create a new contact

app.get('/contacts', function (req, res) {
    db.collection(CONTACTS_COLLECTION).find({}).toArray(function (err, docs) {
        if (err) handleError(res, err.message, 'Failed to get contacts');
        res.status(200).json(docs);
    });
});

app.post('/contacts', function (req, res) {
    var newContact = req.body;
    newContact.createDate = new Date();

    if (!req.body.firstName || !req.body.lastName) {
        handleError(res, 'Invalid user input', 'Must provide a first or last name');
    }

    db.collection(CONTACTS_COLLECTION).insertOne(newContact, function (err, doc) {
        if (err) handleError(res, err.message, 'Failed to create a new contact');
        res.status(201).json(doc.ops[0]);
    });
});


// '/contacts/:id'
// GET: find contact by id
// PUT: update contact by id
// DELETE: delete contact by id

app.get('/contacts/:id', function (req, res) {
    db.collection(CONTACTS_COLLECTION).findOne({_id: new ObjectID(req.params.id)}, function (err, doc) {
        if (err) handleError(res, err.message, 'Failed to get contact');
        res.status(200).json(doc);
    });
});

app.put('/contacts/:id', function (req, res) {
    db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, function (err, doc) {
        if (err) handleError(res, err.message, 'Failed to update contact');
        res.status(204).json(doc);
    })
});

app.delete('/contacts/:id', function (req, res) {
    db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function (err, doc) {
        if (err) handleError(res, err.message, 'Failed to update contact');
        res.status(204).end();
    })
});
