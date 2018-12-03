const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  let config = require('./config.json'); //json parsed into js object directly
  let envConfig = config[env];

  Object.keys(envConfig).forEach((key) => { // turns keys into array
    process.env[key] = envConfig[key]       // use to set key and value for process.env
  });

}


console.log('env *****', env);
