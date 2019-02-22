const {Client}  = require('../../server/models/client');
const faker     = require('faker/locale/en');

const makeClient = ( async () => {
  return await new Client({
    name: faker.name.findName(),
    email: faker.internet.email(),
    phone: '07724367851'
  }).save();
});


module.exports = { makeClient}
