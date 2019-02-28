const {Invoice} = require('../../server/models/invoice');
const faker     = require('faker/locale/en');
const mongoose  = require('mongoose');
const moment = require('moment');
const now = () => { return moment().format('YYYY MM DD') };
const then = () => { return moment().subtract(30, 'days').calendar();}

const makeUnpaidInvoice =  async (id) => {
  return await new Invoice({
            invNo      : 1,
            invDate    : Date.now(),
            message    : "thanks",
            client     : {
                _id         : id,
                name        : 'client name',
                email       : faker.internet.email(),
                phone       : "07967355526"
            },
            items      : [{date: faker.date.between(then(), now()), desc:'working hard', fee:'20.00'},
                          {date: faker.date.between(then(), now()), desc:'working very hard', fee:'40.00'},
                          {date: faker.date.between(then(), now()), desc:'work even harder', fee:'40.00'}],
            details    : {
                utr         : "1234567891",
                email       : "myemail@email.com",
                phone       : "07865356742",
                bank        : "the bank",
                sortcode    : "00-00-00",
                accountNo   : "12345678",
                terms       : "cash is king",
                contact     : "myemail@example.com"
            },
            paid        : false
          }).save();
}

const makePaidInvoice =  async (id) => {
  return await new Invoice({
            invNo      : 1,
            invDate    : Date.now(),
            message    : "thanks",
            client     : {
                _id         : id,
                name        : 'client name',
                email       : faker.internet.email(),
                phone       : "07967355526"
            },
            items      : [{date: faker.date.between(then(), now()), desc:'working hard', fee:'20.00'},
                          {date: faker.date.between(then(), now()), desc:'working very hard', fee:'40.00'},
                          {date: faker.date.between(then(), now()), desc:'work even harder', fee:'40.00'}],
            details    : {
                utr         : "1234567891",
                email       : "myemail@email.com",
                phone       : "07865356742",
                bank        : "the bank",
                sortcode    : "00-00-00",
                accountNo   : "12345678",
                terms       : "cash is king",
                contact     : "myemail@example.com"
            },
            paid        : true,
            datePaid    : Date.now(),
          }).save();
}

module.exports = { makeUnpaidInvoice, makePaidInvoice};
