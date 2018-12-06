const mongoose  = require('mongoose');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');

let UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  password: {
    type: String,
    require: true,
    minlength: 7
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

UserSchema.methods.toJSON             = function () {
  let user = this;
  let userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken  = function () {
  let user = this;
  let access = 'auth';
  let token = jwt.sign({_id : user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

  user.tokens.push({access, token});
  // user.tokens = user.tokens.concat([{access, token}]);

  return user.save().then(() => {
    return token;
  })
};

UserSchema.methods.removeToken        = function (token) {
  let user = this;                            // user user object
  return user.updateOne({                     // update doc with $pull
    $pull: {                                  // will delete object with matching token in tokens array in db
      tokens: {token}                         // use return to pass back to server.js
    }
  });
};

UserSchema.statics.findByToken        = function (token) {
  let User = this;
  let decoded; // not decoded = jwt.verify incase of error....

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {                                 // jwt.verify fails so promise with reject returned
    return Promise.reject();
  }
  return User.findOne({   //success case returns promise to server.js, the relevant user object
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.findByCredentials  = function (email, password) {
  let User = this;
  return User.findOne({email}).then((user) => {   // find user with matching email
    if (!user) {                                  // return rejected promise if user doesn't exist
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {                   // wrap bcrypt in promise (uses callbacks)
      bcrypt.compare(password, user.password, (err, res) => {   // plain test password match hashed p/word from db
        if (res) {
          resolve(user);                                        // if res true (matches) resolve with user
        } else {
          reject();                                             // no match reject to catch block
        }
      });
    });
  });
};

UserSchema.pre('save', function (next) {
  let user = this;

  if (user.isModified('password') ) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

let User = mongoose.model('User', UserSchema);

module.exports = {User};
