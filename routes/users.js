var express = require('express');
var router = express.Router();
var db = require('../db/index');
var jwt = require('jsonwebtoken');
const config = require('../config');
var bcrypt = require('bcrypt-nodejs');
const { exec } = require('child_process');
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
  console.log("regis")
  const { firstname, lastname, username, email, password } = req.body.userData;
  const hash = bcrypt.hashSync(password);
  const dataToInsert = {
    firstname,
    lastname,
    username,
    email,
    password: hash
  };


  var cmdall = 'mkdir /home/'+username+' && chmod -R 777 /home/'+username+' && useradd -d /home/'+username+' -s /bin/bash -p $(echo "'+password+'" | openssl passwd -1 -stdin) '+username;
  console.log(cmdall)
  var cmd = exec( cmdall, function (err, stdout, stderr){
    console.log(stdout);
    console.log(err);
    console.log(stderr);
    })
    

  const handler = (err, result) => {
    console.log("handler online");
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


router.post('/changepassword', (req, res, next) => {
  const { username, password } = req.body.userData;
  const hash = bcrypt.hashSync(password);
  const dataToUpdate = {
    username,
    hash
  };
  if (password === undefined) {
      res.status(401).json({
          success: false,
          message: "Please put your password"
      })
  } else {
      //find user in mongodb
      const handler = (err, result) => {
          if (!err && result !== null) {
              res.json({
                  success: true,
              });
          }else{
              res.status(401).json({
                  success: false,
                  message: 'Error.',
                  err: err
              })
          }
      }
      db.UpdatePassword( dataToUpdate, handler)
  }
});

router.post('/changeemail', (req, res, next) => {
  const { username, email } = req.body.userData;
  const dataToUpdate = {
    username,
    email
  };
  if (email === undefined) {
      res.status(401).json({
          success: false,
          message: "Please put your email"
      })
  } else {
      //find user in mongodb
      const handler = (err, result) => {
          if (!err && result !== null) {
              res.json({
                  success: true,
              });
          }else{
              res.status(401).json({
                  success: false,
                  message: 'Error.',
                  err: err
              })
          }
      }
      db.UpdateEmail( dataToUpdate, handler)
  }
});


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
const multer = require('multer');
  const upload = multer({ dest : 'uploadtmp/' });

router.post('/uploadfiles', upload.single('statement'), (req, res, next) => {
  console.log(`new upload = ${req.file.filename}\n`);
  console.log(req.file);
  res.json({ msg: 'upload works' });
  //fs = require('fs');
  //let data = req.body.userData.files_data;
  /*
  fs.writeFile('testfile.txt',data,function(err,data) {
if(err){
  return console.log(err)
}else{
  console.log(data)
}
  })*/
  //
  console.log(req.body.userData.files_data);
  /*
  const { firstname, lastname, username, email, password } = req.body.userData;
  const hash = bcrypt.hashSync(password, config.SALT_ROUNDS);
  const dataToInsert = {
    firstname,
    lastname,
    username,
    email,
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
  db.uploadfiles(dataToInsert, handler);
  */
});

module.exports = router;
