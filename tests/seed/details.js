const {Detail}  = require('../../server/models/detail');
const faker     = require('faker/locale/en');

const makeDetails = ( async () => {
  return await new Detail({
    utr       : 1234567898,
    email     : faker.internet.email(),
    phone     : '07956245637',
    bank      : 'The Bank Complany',
    sortcode  : 203445,
    accountNo : 23456789,
    terms     : 'pay now',
    farewell  : 'yours',
    contact   : 'it is me'
  }).save();
});


module.exports = { makeDetails}
