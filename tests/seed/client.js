const {Client}  = require('../../server/models/client');
const faker     = require('faker/locale/en');

const makeClient = (async () => {
  return await new Client({
    name: faker.name.findName(),
    email: faker.internet.email(),
    phone: '07724367851',
    address1: faker.address.streetAddress(),
    address2: faker.address.county(),
    postcode: 'ab1 1ba'
  }).save();
});

const makeFrank = (async () => {
  return await new Client({
    name: 'frank',
    email: 'frank@frank.com',
    phone: '07724367851',
    address1: 'Frank street',
    address2: 'Franksville',
    postcode: 'ab1 1ba'
  }).save();
});

const makeDave = (async () => {
  return await new Client({
    name: 'dave',
    email: 'dave@dave.com',
    phone: '07724367851',
    address1: faker.address.streetAddress(),
    address2: faker.address.county(),
    postcode: 'ab1 1ba'
  }).save();
});


module.exports = { makeClient, makeDave, makeFrank}
