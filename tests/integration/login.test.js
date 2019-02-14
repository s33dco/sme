const request   = require('supertest');
const {User}    = require('../../server/models/user');
const mongoose  = require('mongoose');
const cheerio   = require('cheerio');
const app       = require('../../app');

let server, user, cookie, csrfToken, password;

beforeEach( async () => {
  user = await new User({
    firstName: "Name",
    lastName: "Surname",
    email: "email@example.com",
    password: "password",
    isAdmin : true
  }).save();
});

afterEach( async () => {
  await User.deleteMany();
});

describe('/login', () => {

  describe('GET /', () => {

    const exec = async () => {
      const res = await request(app).get(`/login`);
      let $ = cheerio.load(res.text);
      csrfToken = $('[name=_csrf]').val();
      return res;
    };

    it('should return the login form', async () => {
      const res = await exec();
      cookie = res.headers['set-cookie'];
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Sign In/);
    });
  });

  describe('POST /', () => {

    const getLogin = async () => {
      const res = await request(app).get(`/login`);
      let $ = cheerio.load(res.text);
      csrfToken = $('[name=_csrf]').val();
      cookie = res.headers['set-cookie'];
      return res;
    };

    const postLogin = async () => {
      return request(app)
      .post(`/login`)
      .set('Cookie', cookie)
      .send({ email: user.email,
              password: password,
              _csrf: csrfToken
            });
    };

    it('should return 401 without incorrect user info', async () => {
      await getLogin();
      password = 'wrongpassword';
      // just for sanity...
      console.log('csrfToken from GET/login form :', csrfToken);
      console.log('set-cookie from GET/login res.headers :', cookie);
      const res = await postLogin();
      expect(res.status).toBe(401)
    });

    it('should return 403 without csrf token/header credentials', async () => {
      await getLogin();
      csrfToken = '';
      cookie = '';
      // just for sanity...
      console.log('csrfToken from GET/login form :', csrfToken);
      console.log('set-cookie from GET/login res.headers :', cookie);
      const res = await postLogin();
      expect(res.status).toBe(403)
    });

    it('should return 200 with correct credentials', async () => {
      await getLogin();
      // just for sanity...
      console.log('csrfToken from GET/login form :', csrfToken);
      console.log('set-cookie from GET/login res.headers', cookie);
      password = 'password';
      const res = await postLogin();
      expect(res.status).toBe(200)
    });
  });
});
