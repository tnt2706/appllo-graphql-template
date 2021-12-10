module.exports = {
  // mongodb
  database_test: 'mongodb://localhost/sm_report_test',
  database: process.env.DB_CONNECTION_STRING || 'mongodb://localhost/sm_report_test',
  mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },
  commonDb: process.env.COMMON_DB_CONNECTION_STRING,
  // redis
  redisDbs: {
    authDb: {
      port: 6379,
      host: process.env.REDIS_URL,
      auth_pass: process.env.SKIP_TLS ? undefined : process.env.REDIS_AUTH,
      db: parseInt(process.env.AUTHENTICATION_STORE, 10),
      get tls() {
        return (process.env.NODE_ENV === 'test' || process.env.SKIP_TLS) ? undefined : { servername: this.host };
      },
    },
  },
};
