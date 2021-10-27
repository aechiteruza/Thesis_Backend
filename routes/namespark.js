var express = require('express');
var router = express.Router();
var db = require('../db/namesparkdb');
var jwt = require('jsonwebtoken');
const config = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Docker = require('dockerode');
var dockerHostIP = "192.168.56.104"


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
  const { username, namespark,passwordspark, packages, filename } = req.body.userData;
  var namecon = username.concat(namespark)
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var setcmd = "--NotebookApp.token='"+passwordspark+"'"
  var mount = '/home/'+username+'/:/home/jovyan/work/'
  docker.createContainer({
    name: namecon,
    Image: 'jupyter/pyspark-notebook',
    AttachStdin: false,
    AttachStdout: false,
    AttachStderr: false,
    Tty: false,
    Cmd: ['start-notebook.sh',setcmd],
    OpenStdin: false,
    StdinOnce: false,
    HostConfig: {
      Binds:[mount],
      PortBindings: {
        "8888/tcp": [
          {
            HostIp: "0.0.0.0",
            HostPort: "0"  
          }
        ]
      }
    }
  })

  const dataToInsert = {
    username,
    namespark,
    packages,
    filename
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
});

router.post('/listusers', (req, res, next) => {
  const { username } = req.body.userData;
  const handler = (err, result) => {
    if (!err && result !== null) {
      result.toArray((err, users) => {
        if (!err) {
          res.json({
            success: true,
            namespark: result.namespark,
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
  const { username, namespark } = req.body.userData;
  var namecon = username.concat(namespark)
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
  db.deletecontainner(namespark, handler)

  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var container = docker.getContainer(namecon);
  container.stop(function (err, data) {
    console.log(data);
  })
  container.remove(function (err, data) {
    console.log(data);
  })

})




router.post('/runcontainer', (req, res, next) => {
  const { username, namespark, packages, filename } = req.body.userData;
  console.log(req.body)
  var namecon = username.concat(namespark)
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var container = docker.getContainer(namecon);
  container.start(function (err, data) {
    console.log(data);
  });
  var command = "";
  if(packages == ""){
    command = ["/usr/local/spark/bin/spark-submit", "/home/jovyan/work/"+filename ]
  }else{
    command = ["/usr/local/spark/bin/spark-submit", "--packages", packages,"/home/jovyan/work/"+filename ]
  }
  console.log("val : ",filename," : ",packages)
  console.log("command : ",command)
  async function execute(command) {
  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true
   });

   return new Promise(async (resolve, reject) => {
     console.log("start promise")
     await exec.start(async (err, stream) => {
       if (err) return reject();
       let message = '';
       stream.on('data', data => console.log(message += data.toString()));
       stream.on('end', () => resolve(message));
       console.log("streammmmm",message)
     });
     
   });
}

  container.unpause(function (err, data) {
    console.log(data);
  });
  res.json({
    success: true,
    data: "running"
  });
  setTimeout(execute(command).then(),10000);
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
      }); console.log(data.State.Status)
    }

  });
});

router.post('/getportcontainer', (req, res, next) => {
  const {
    namecontainer
  } = req.body.userData;
  console.log(namecontainer);
  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  let namecon = [];
  docker.listContainers({ all: true }, function (err, containers) {
    // console.log('ALL: ' + containers.length);
    containers.forEach(function (container) {
      namecon.push(container.Names)
      //console.log(container.Names)
    })
    for (let i = 0; i < namecon.length; i++) {
      if (namecon[i].toString() === "/" + namecontainer) {
        const port = JSON.stringify(containers[i].Ports).split(",")[2];
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
        console.log("Don't Find at I = "+i)
      }
    }
  });
});


router.post('/stopcontainner', (req, res, next) => {
  const { username, namespark } = req.body.userData;
  res.json({
    success: true,
    data: "Device not run"
  });
  var namecon = username.concat(namespark)

  var docker = new Docker({ socketPath: '/var/run/docker.sock' });
  var container = docker.getContainer(namecon);
  container.pause(function (err, data) {
    console.log(data);
  });
})
module.exports = router;
