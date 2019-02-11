const request   = require('supertest');
const {User}    = require('../../server/models/user');
const {Client}  = require('../../server/models/client');
const mongoose  = require('mongoose');

let server;
let user;
let clients;
let token;
let id;

beforeEach( async () => {
  server  = require('../../index.js');
  clients = [
              {  name: "Client One",
                email: "client1@example.com",
                phone: "01234567890"},
              { name: "Client Two",
                email: "client2@example.com",
                phone: "02234567890"}
  ]
  clients = await Client.insertMany(clients);
});

afterEach( async () => {
  await server.close();
  await Client.deleteMany();
  await User.deleteMany();
});

describe('/clients', () => {

  describe('GET / ', () => {

    beforeEach( async () => {
      user = await new User({
        firstName: "Testy",
        lastName: "Tester",
        email: "email@example.com",
        password: "password",
        isAdmin : true
      }).save();
      token = user.generateAuthToken();
    });

    const exec = async () => {
      return await request(server).get('/clients').set('Cookie', `token=${token}`);
    };

    it('should return all the clients when logged in', async () => {
      const res = await exec();
      expect(res.text).toMatch(/Client One/);
      expect(res.text).toMatch(/Client Two/);
    });

    it('should return 401 when not logged in', async () => {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });

  });

  describe('GET / :id', () => {

    beforeEach( async () => {
      user = await new User({
        firstName: "Testy",
        lastName: "Tester",
        email: "email@example.com",
        password: "password",
        isAdmin : true
      }).save();
      token = user.generateAuthToken();
      id = clients[0]._id
    });

    const exec = async () => {
      return await request(server).get(`/clients/${id}`).set('Cookie', `token=${token}`);
    };

    it('should return the id record when logged in', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Client One/);
    });

    it('should return no 404 for invalid id', async () => {
      id = 'notanid';
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 404 for not found id', async () => {
      id = mongoose.Types.ObjectId;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 401 when not logged in', async () => {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it('should return 403 when logged in but not isAdmin:true', async () => {
      notAdmin = await new User({
        firstName: "Another",
        lastName: "Nonadmin",
        email: "email@example.com",
        password: "password",
        isAdmin : false
      }).save();
      await notAdmin.save();
      token = await notAdmin.generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

  });

});
