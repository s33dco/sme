// const jwt       = require('jsonwebtoken');
//
// module.exports = function auth(req, res, next) {
//   const token = req.header('x-auth');
//   if (!token) return res.status(401).send('Access denied. No token provided')
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   }
//   catch (ex) {
//     res.status(400).send('Invalid token');
//   }
// }









// const {User} = require('./../models/user');



// let authenticate = (req, res, next) => {
//   let token = req.header('x-auth') ;
//
//   User.findByToken(token).then((user) => {
//     if (!user) {
//       return Promise.reject();                  // no user so send to catch block
//     }
//     req.user = user;
//     req.token = token;
//     next();
//   }).catch((e) => {                             // catch error from try block in UserSchema jwt.verify
//     res.status(401).send();                     // send back 401 error and empty body
//   });
// };

// module.exports = { authenticate };
