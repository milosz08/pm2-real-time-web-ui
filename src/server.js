'use strict';

const express = require('express');
const http = require('http');
const nocache = require('nocache');
const expressSession = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars');

const config = require('./utils/config');
const session = require('./utils/session');
const { commonVariables } = require('./middleware/root');
const logger = require('./utils/logger');
const db = require('./db/config');

const app = express();
const httpServer = http.createServer(app);

db.connect();
db.createDefaultAdminAccount();

const io = new Server(httpServer);
const sessionIo = io.of('/session');

module.exports = {
  io,
  sessionIo,
};

app.use(nocache());
app.use(cookieParser());

app.use(expressSession({
  secret: config.sessionSecret,
  saveUninitialized: true,
  cookie: {
    maxAge: config.sessionMaxLife * 1000,
    secure: config.isProd,
  },
  resave: true,
  rolling: true,
  store: session.sessionStore,
}));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/static', express.static(path.resolve(__dirname, 'public')));
app.use('/', commonVariables);

app.use('/api', express.json());
app.use('/', express.urlencoded({ extended: true }));

const webRouter = require('./router/web');
const apiRouter = require('./router/api');

app.use('/', webRouter);
app.use('/api', apiRouter);

require('./utils/socketHandler');

process.on('SIGINT', () => db.disconnect('SIGINT'));
process.on('SIGTERM', () => db.disconnect('SIGTERM'));
process.on('SIGQUIT', () => db.disconnect('SIGQUIT'));

httpServer.listen(config.port, () => {
  logger.info(`Server started at port: ${config.port}.`)
});
