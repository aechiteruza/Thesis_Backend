var config = require('../config');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectId;

var db;
var collection;
MongoClient.connect(config.MONGO_URL, (err, database) => {
    if (!err) {
        console.log('Connection MQTT API to MongoDB.');
        const myAwesomeDB = database.db('cloudmqtttest')
        collection = myAwesomeDB.collection('namemqtt')
        //db = database;
        //collection = db.collection('namemqtt');
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
    findAll: (data, handler) => {
        collection.find({username:data},(err, result) => {
            handler(err, result);
        })
    },

    deletecontainner: (data, handler) => {
        collection.remove({namemqtt:data},(err, result) => {
            handler(err, result);
        })
    },
    
}