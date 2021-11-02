var express = require('express');
var router = express.Router();
var db = require('../db/namered');
var jwt = require('jsonwebtoken');
const config = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Docker = require('dockerode');
var dockerHostIP = "192.168.56.103";

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
  const {
    username,
    namered,
    userred,
    passred
  } = req.body.userData;
 console.log("before hash");
  const hash = bcrypt.hashSync(passred);
 console.log("after hash");
  /* */
  const dataToInsert = {

    username,
    namered,
    userred,
    passred: hash

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
  var fs = require('fs')
  fs.readFile('noderedtemplate/template.js', "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }
    var result = data.replace(/{{username}}/g, userred);
    var result2 = result.replace(/{{password}}/g, hash);
    fs.writeFile('usepassnodered/' + username + namered + '.js', result2, 'utf8', function (err) {
      if (err) return console.log(err);
    });
  });


  var namecon = username.concat(namered)
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var noderedConfig = "/usr/local/reactsites/reactbackend/usepassnodered/" + namecon + ".js";
  docker.createContainer({
    name: namecon,
    Image: 'noderedfixchange',
    AttachStdin: false,
    AttachStdout: false,
    AttachStderr: false,
    Tty: false,
    Cmd: [],
    OpenStdin: false,
    StdinOnce: false,
    HostConfig: {
      Binds: [
        noderedConfig + ":/data/settings.js"
      ],
      PortBindings: {
        "1880/tcp": [
          {
            HostIp: "0.0.0.0",
            HostPort: "0"   
          }
        ]
      }
    }

  })

});



router.post('/listusers', (req, res, next) => {
  const {
    username
  } = req.body.userData;
  const handler = (err, result) => {
    if (!err && result !== null) {
      result.toArray((err, users) => {
        if (!err) {
          res.json({
            success: true,
            namered: result.namered,
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

router.post('/deletecontainner', (req, res, next) => {
  const {
    username,
    namered
  } = req.body.userData;
  var namecon = username.concat(namered)
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
  db.deletecontainner(namered, handler)

  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var container = docker.getContainer(namecon);
  container.stop(function (err, data) {
    //console.log("removecon"+data);
  });

  container.remove(function (err, data) {
    //console.log("removecon"+data);
  });

  var fs = require('fs')
  fs.unlink('usepassnodered/' + username + namered + '.js', function (err) {
    if (err) return console.log(err);
  });

})


router.post('/runcontainer', (req, res, next) => {
  const {username,namered} = req.body.userData;
  res.json({
    success: true,
    data: "running"
  });
  var namecon = username.concat(namered)
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var container = docker.getContainer(namecon);
  container.start(function (err, data) {

    //console.log("after run")
    console.log(data);
  });
  container.unpause(function (err, data) {

    //console.log("after run")
    console.log(data);
  });
})


router.post('/getstatuscontainer', (req, res, next) => {
  const {
    namecontainer
  } = req.body.userData;
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var container = docker.getContainer(namecontainer);
  container.inspect(function (err, data) {
    if (data == null) {
      res.json({
        success: true,
        data: "exited"
      });
    } else {
      res.json({
        success: true,
        data: data.State.Status
      });
      //console.log(data.State.Status)
    }
  });
});

router.post('/getportcontainer', (req, res, next) => {
  const {
    namecontainer
  } = req.body.userData;
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  let namecon = [];
  docker.listContainers({ all: true }, function (err, containers) {
    console.log('ALL: ' + containers.length);
    if(containers.length == 0){
      console.log("Device not run")
    }else{
      console.log("else condition")
    }
    containers.forEach(function (container) {
      namecon.push(container.Names)

    })
    for (let i = 0; i < namecon.length; i++) {
      if (namecon[i].toString() === "/" + namecontainer) {
        const port = JSON.stringify(containers[i].Ports).split(",")[2];
        console.log("port : "+port)
        if (port == undefined) {
          res.json({
            success: true,
            data: "Device not run"
          });
        } else {
          const portnumber = port.split(":")[1];
          res.json({
            success: true,
            data: dockerHostIP + ":" + portnumber
          });
        }
        break;
      } else if (i == namecon.length - 1) {
        res.json({
          success: true,
          data: "Device not run"
        });
      } else {
        //console.log("Don't Find at I = "+i)
      }
    }

  });
});

router.post('/getportuicontainer', (req, res, next) => {
  const {
    namecontainer
  } = req.body.userData;
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  let namecon = [];
  docker.listContainers({ all: true }, function (err, containers) {
    //console.log('ALL: ' + containers);

    containers.forEach(function (container) {
      namecon.push(container.Names)
      //console.log(container.Names)
    })
    for (let i = 0; i < namecon.length; i++) {
      if (namecon[i].toString() === "/" + namecontainer) {
        const port = JSON.stringify(containers[i].Ports).split(",")[2];
        //console.log(JSON.stringify(containers[i].Ports))
        if (port == undefined) {
          //console.log("no port");
          res.json({
            success: true,
            data: "Device not run"
          });
        } else {
          const portnumber = port.split(":")[1];
          // console.log(portnumber)
          res.json({
            success: true,
            data: dockerHostIP + ":" + portnumber + "/ui"
          });
        }
        break;
      } else if (i == namecon.length - 1) {
        res.json({
          success: true,
          data: "Device not run"
        });
      } else {
        //console.log("Don't Find at I = "+i)
      }
    }
  });
});



router.post('/stopcontainner', (req, res, next) => {
  const {
    username,
    namered
  } = req.body.userData;
  res.json({
    success: true,
    data: "Device not run"
  });
  var namecon = username.concat(namered)
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var container = docker.getContainer(namecon);
  container.pause(function (err, data) {
    console.log(data);
  });


})

module.exports = router;
