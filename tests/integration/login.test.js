const request   = require('supertest');
const {User}    = require('../../server/models/user');
const mongoose  = require('mongoose');
const cheerio   = require('cheerio');
const app       = require('../../app');
const agent     = request.agent(app);

let user, csrfToken, password, cookies;

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
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Sign In/);
    });
  });

  describe('POST /', () => {

    const getLoginCsrfs = async () => {
      const res = await request(app).get(`/login`);
      let $ = cheerio.load(res.text);
      csrfToken = $('[name=_csrf]').val();
      cookies = res.headers['set-cookie'][0].split(/,(?=\S)/).map((item) => item.split(';')[0]);
      return res;
    };

    const postLogin = async () => {
      return request(app).post(`/login`)
        .set('Cookie', cookies)
        .send({ email: user.email,
                password: password,
                _csrf: csrfToken
        });
    };

    it('should return 401 without incorrect user info', async () => {
      await getLoginCsrfs();
      password = 'wrongpassword';
      const res = await postLogin();
      expect(res.status).toBe(401)
    });

    it('should return 403 without csrf token/header credentials', async () => {
      await getLoginCsrfs();
      csrfToken = '';
      cookies = '';
      password = 'password';
      const res = await postLogin();
      expect(res.status).toBe(403)
    });

    it('should return 200 with correct credentials', async () => {
      await getLoginCsrfs();
      password = 'password';
      const res = await postLogin();
      expect(res.status).toBe(200)
    });
  });
});
