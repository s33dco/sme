const {User}  = require('../../server/models/user');
const faker     = require('faker/locale/en');

const makeUser = ( async () => {
  return await new User({
    firstName: faker.name.firstName(),
    lastName: faker.name.firstName(),
    email: faker.internet.email(),
    password: "password",
    isAdmin : false
  }).save();
});

const makeAdmin = ( async () => {
  return await new User({
    firstName: faker.name.firstName(),
    lastName: faker.name.firstName(),
    email: faker.internet.email(),
    password: "password",
    isAdmin : true
  }).save();
});

module.exports = { makeUser, makeAdmin}
