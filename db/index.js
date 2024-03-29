var config = require('../config');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectId;

var db;
var collection;
MongoClient.connect(config.MONGO_URL, (err, database) => {
    if (!err) {
        console.log('Connection User API to MongoDB.');
        const myAwesomeDB = database.db('cloudmqtttest')
        collection = myAwesomeDB.collection('users')
        //db = database;
        //collection = db.collection('users');
    } else {
        console.log('Not possible to established the connection to MongoDB.');
    }
})

module.exports = {
    register: (data, handler) => {
        collection.insertOne(data, (err, result) => {
            handler(err, result);
        })
    },
    findUser: (data, handler) => {
        collection.findOne(data, (err, result) => {
            handler(err, result);
        })
    },
    findAll: (handler) => {
        collection.find((err, result) => {
            handler(err, result);
            
        })
    },

    UpdatePassword: (datakey, handler) => {
        collection.update({username:datakey.username} ,{$set:{password:datakey.hash}} , (err, result) => {
            handler(err, result);
        });
    },

    UpdateEmail: (datakey, handler) => {
        collection.update({username:datakey.username} ,{$set:{email:datakey.hash}} , (err, result) => {
            handler(err, result);
        });
    }
}