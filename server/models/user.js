const config = require('config');
const mongoose  = require('mongoose');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');

let userSchema = new mongoose.Schema({
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
  isAdmin : {
    type: Boolean,
    default : false
  }
});

userSchema.statics.findByEmail = function (email){
  return this.findOne({email : email });
}

userSchema.methods.generateAuthToken = function (){
  const token = jwt.sign({_id: this._id, isAdmin: this.isAdmin, name: this.firstName}, config.get('JWT_SECRET'), { expiresIn: '1h' });
  return token;
};

userSchema.pre('save',  async function (next) {
  let user = this;

  if (user.isModified('password') ) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  next();
});

let User = mongoose.model('User', userSchema);

module.exports = {User};
