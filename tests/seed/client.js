const {User}  = require('../../server/models/user');
const faker     = require('faker/locale/en');

const makeClient = ( async () => {
  return await new User({
    name: faker.name.findName(),
    email: faker.name.firstName(),
    phone: '07724367851'
  }).save();
});


module.exports = { makeClient}
