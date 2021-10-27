var config = require('../config');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectId;
var MongoClient2 = require('mongodb').MongoClient;
var db;
var collection;
MongoClient.connect(config.MONGO_URL, (err, database) => {
    if (!err) {
        console.log('Connection CreateDB to MongoDB.');
        const myAwesomeDB = database.db('cloudmqtttest')
        collection = myAwesomeDB.collection('createdb')
        //db = database;
        //collection = db.collection('createdb');
    } else {
        console.log('Not possible to established the connection to MongoDB.');
    }
})
/*
MongoClient2.connect('mongodb://superadmin:random2@localhost:27020', (err, database) => {
    if (!err) {
        console.log('Connection CreateDB23323232323 to MongoDB.');
        var name = "testuser4";
        var password = "random2";
        var dbname = "testdb4";
        const myAwesomeDB = database.db('admin');
        var adminmo = myAwesomeDB.admin();
        
        adminmo.addUser(name,password,{
            roles: [{
              role : "readWrite",
              db : dbname
            }]
          },function(err, result){
            if(err){
              return console.log(err);
            }else{
              console.log(result)
            }
              console.log("OKOKOKOKKOKOKOK")

            
          })
        //db = database;
        //collection = db.collection('createdb');
    } else {
        console.log(err)
        console.log('1212Not possible to established the connection to MongoDB.');
    }
})
*/
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
        collection.remove({dbname:data},(err, result) => {
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