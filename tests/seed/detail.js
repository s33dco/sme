const {Detail}  = require('../../server/models/detail');
const faker     = require('faker/locale/en');

const makeDetails = ( async () => {
  return await new Detail({
    business  : 'my business name',
    utr       : 1234567898,
    email     : faker.internet.email(),
    phone     : '07956245637',
    bank      : 'The Bank Complany',
    sortcode  : 203445,
    accountNo : 23456789,
    terms     : 'pay now',
    farewell  : 'yours',
    contact   : 'it is me',
    address1  : faker.address.streetAddress(),
    address2  : faker.address.county(),
    postcode  : 'ab1 1ba'
  }).save();
});


module.exports = { makeDetails}
