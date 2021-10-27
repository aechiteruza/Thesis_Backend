var express = require('express');
var router = express.Router();
var db = require('../db/test');
var jwt = require('jsonwebtoken');
const config = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Docker = require('dockerode');
var dockerHostIP = "192.168.56.103"
var dockerHostPort = 2375
const Influx = require('influx');
const influx = new Influx.InfluxDB('http://192.168.56.103:8086');
console.log('start connection');
var mysql = require('mysql');
var con = mysql.createConnection({
  host: '192.168.56.103',
  user: 'root',
  password: 'random2',
  port: 3306
})

console.log('end connection');

const handleToken = (req, res, next) => {
  //if authenticated and valid token
  //return next
  //if not 401
  let token = req.headers['authorization'].split(' ')[1];
  jwt.verify(token, config.JWT_KEY, (err, decode) => {
    if (!err) {
      next()
    } else {
      res.status(401).json({
        success: false,
        error: err
      });
    }
  })
}


/* GET users listing. */
router.post('/register', (req, res, next) => {
  const { username, selectdb, dbname, name, password } = req.body.userData;
  console.log(username, selectdb, dbname, name, password)
  const hash = bcrypt.hashSync(password);
  
  if ("InfluxDB" == selectdb) {
     var host = "192.168.56.103:8086"; var link = "https://timeseriesadmin.github.io/" 
    } else if("MySQL" == selectdb){
      var host = "192.168.56.103:3306"; var link = "https://192.168.56.103:8500/" 
     } else {
       var host = "192.168.56.103:27020"; var link = "https://www.mongodb.com/products/compass" 
    }
  const dataToInsert = {
    username,
    selectdb,
    dbname,
    name,
    host,
    link,
    password: hash
  };


  const handler = (err, result) => {
    if (!err) {
      res.json({
        success: true,
        message: "User Registered.",
        data: result
      });
    } else {
      res.json({
        success: false,
        message: "User not Registered.",
        data: result
      });
    }

  }
  db.register(dataToInsert, handler);
  // Influxdb
  var type = "InfluxDB"
  var type = "InfluxDB"
  if ("InfluxDB" == selectdb) {
    //console.log("dddddddd")
    let dataname = dbname;
    let dbuser = name;
    let dbpassword = password;
    influx.createDatabase(dataname)
    influx.createUser(dbuser, dbpassword)
    influx.grantPrivilege(dbuser, 'ALL', dataname)
    //console.log("5555555555")
  } else if ("MySQL" == selectdb) {
    console.log("MySQL Type");
    con.connect(function (err) {
      if (err) throw err;
      console.log('Connected');
      con.query("CREATE DATABASE " + dbname, function (err, result) {
        if (err) throw err;
        console.log("Database Created");
      })
      con.query("CREATE USER '" + name + "'@'%' IDENTIFIED BY '" + password + "';", function (err, result) {
        if (err) throw err;
        console.log("USER Created");
        
          con.query("GRANT ALL PRIVILEGES ON " + dbname + ".* TO '" + name + "'@'%';", function (err, result) {
            if (err) throw err;
            console.log("GRANT Finish");
          })

          con.query("FLUSH PRIVILEGES;", function (err, result) {
            if (err) throw err;
            console.log("FLUSH");
          })
        })

      })


    
    /*
    var mysql = require('mysql');
    var con = mysql.createConnection({
      host: 'localhost:3306',
      user: 'root',
      password: 'random2'
    })
    con.connect(function(err){
      if(err) throw err;
      console.log('Connected');
    })
    */
  } else {
    console.log("finish")
    var MongoClient2 = require('mongodb').MongoClient
    MongoClient2.connect('mongodb://adminmongo:random2@localhost:27020', (err, database) => {
      if (!err) {
        console.log('Connection CreateDBbbbbb to MongoDB.');
        const myAwesomeDB = database.db(dbname)
        myAwesomeDB.addUser(name, password, {
          roles: [{
            role: "readWrite",
            db: dbname
          }]
        }, function (err, result) {
          if (err) {
            return console.log("error db create");
          } else {
            console.log(result)
          }
          console.log("OKOKOKOKKOKOKOK")
          database.close()

        })
      } else {
        console.log(err)
        console.log('Not possible to established the connection to MongoDB.');
      }
    })
  }

});

router.post('/deletecontainner', (req, res, next) => {
  console.log(req.body);
  //find user in mongodb
  const { dbname } = req.body.userData;
  console.log(dbname);
  //var namecon = username.concat(namered)
  const handler = (err, result) => {
    if (!err) {
      res.json({
        success: true,
        message: "User Registered.",
        data: result
      });
    } else {
      res.json({
        success: false,
        message: "User not Registered.",
        data: result
      });
    }
  }
  db.deletecontainner(dbname, handler)

})

router.post('/runcontainer', (req, res, next) => {
  const { selectdb, dbname } = req.body.userData;
  console.log(selectdb, dbname);
  res.json({
    success: true,
    data: "Device not run"
  });
  var type = "InfluxDB"
  if (type == selectdb) {
    console.log(selectdb)
    var docker = new Docker({ socketPath: '/var/run/docker.sock' });
    // Run Create ImageInflux
    influx.createDatabase(dbname) //create database influx
    docker.run('influxdb', [], undefined, {
      "name": dbname, //ชื่อ containner ต้องรับจากผู้ใช้

      "HostConfig": {
        "PortBindings": {
          "8086/tcp": [
            {
              "HostIp": "0.0.0.0",
              "HostPort": "0"   //Map container to a random unused port.
            }
          ]
        }
      }
    }, function (err, data, container) {
      if (err) {
        return console.error(err);
      }
      console.log(data.StatusCode);
    });

  }
  else if (type !== selectdb) {
    console.log(selectdb)
    var docker = new Docker({ socketPath: '/var/run/docker.sock' });
    docker.createContainer({
      name: dbname,
      Image: 'mongo',
      AttachStdin: false,
      AttachStdout: false,
      AttachStderr: false,
      Tty: false,
      Cmd: [],
      OpenStdin: false,
      StdinOnce: false,
      HostConfig: {
        PortBindings: {
          "27017/tcp": [
            {
              HostIp: "0.0.0.0",
              HostPort: "0"   //Map container to a random unused port.
            }
          ]
        }
      }

    }).then(function (container) {
      return container.start();
    }).catch(function (err) {
      console.log(err);
    });

  }

})

/* router.post('/stopcontainner',(req, res, next) => {
   //console.log(req.body);
       //find user in mongodb
       const { dbname } = req.body.userData;
       
 
var docker = new Docker({ host: dockerHostIP, port: dockerHostPort });
       var container = docker.getContainer(dbname);
      container.stop(function (err, data) {
        console.log(data);
       });
   }) 
*/


router.post('/listusers', (req, res, next) => {
  //console.log(req.body);
  //find user in mongodb
  const { username } = req.body.userData;
  console.log(username)
  const handler = (err, result) => {
    if (!err && result !== null) {
      result.toArray((err, users) => {
        if (!err) {
          res.json({
            success: true,
            selectdb: result.selectdb,
            dbname: result.dbname,
            name: result.name,
            host: result.host,
            data: users
          });
        }
      })
    } else {
      res.json({
        success: false,

        error: err
      })
    }

  }

  db.findAll(username, handler)


})
/*
router.post('/listusers',handleToken, (req, res, next) => {
  //Return list of user and need to authenticated(verufy token)
  const handler = (err, result) => {
    if (!err && result != null) {
      result.toArray((err, users) => {
        if (!err) {
          res.json({
            success: true,
            message: "The list of users.",
            data: users
          });
        }
      })
    } else {
      res.json({
        success: false,
        message: "An error happened.",
        data: err
      });
    }
  }
  db.findAll(handler);
})
*/
module.exports = router;
