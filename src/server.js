'use strict';

const express = require('express');
const http = require('http');
const commandLineArgs = require('command-line-args');
const nocache = require('nocache');
const expressSession = require('express-session');
const expressEjsLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const ms = require('ms');
const { Server } = require('socket.io');

const router = require('./router/web');
const { commonVariables } = require('./middleware/root');

const options = commandLineArgs([
  { name: 'port', alias: 'p', type: Number, defaultValue: 3000 },
]);

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

module.exports = {
  io,
};

require('./socket/handler');

app.use(nocache());
app.use(expressSession({
  secret: 'secret-key',
  saveUninitialized: true,
  cookie: { maxAge: null },
  resave: false,
}));

app.use(expressEjsLayouts);
app.set('layout', 'mainLayout');
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/static', express.static(path.resolve(__dirname, 'public')));

app.use('/', commonVariables);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(router);

httpServer.listen(options.port, () => {
  console.log(`Server started at port: ${options.port}`);
});
