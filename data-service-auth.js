const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

var userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User;

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGO_URI);
    db.on('error', (err) => {
      reject(err);
    });
    db.once('open', () => {
      User = db.model('users', userSchema);
      resolve();
    });
  }); // promise end
}; //initialize

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (
      !userData.password ||
      !userData.password.trim() ||
      !userData.password2 ||
      !userData.password2.trim()
    ) {
      console.log(userData.password);
      reject('Error: user name cannot be empty or only white spaces!');
    } else if (userData.password != userData.password2) {
      reject('Error: Passwords do not match');
    } else {
      let newUser = new User(userData);
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(userData.password, salt, function (err, hashValue) {
          if (err) {
            reject('There was an error encrypting the password');
          } else {
            newUser.password = hashValue;
            newUser.save((err) => {
              if (err && err.code === 11000) {
                reject('User Name already taken');
              } else if (err) {
                reject(`There was an error creating the user: ${err}`);
              } else {
                resolve();
              }
            });
          }
        });
      });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .exec()
      .then((foundUser) => {
        if (foundUser.length < 1) {
          reject(`Unable to find user: ${userData.userName}`);
        } else {
          bcrypt
            .compare(userData.password, foundUser[0].password)
            .then((res) => {
              if (res === true) {
                foundUser[0].loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });
                User.updateOne(
                  { userName: foundUser[0].userName },
                  { $set: { loginHistory: foundUser[0].loginHistory } }
                )
                  .exec()
                  .then(() => {
                    resolve(foundUser[0]);
                  })
                  .catch((err) => {
                    reject(`There
                            was an error verifying the user: ${err}`);
                  });
              } else {
                reject(`Unable to find user: ${userData.userName}`);
              }
            });
        }
      })
      .catch(() => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
};
