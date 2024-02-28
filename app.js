const express = require('express');
const http = require('http');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize, User, Sequelize } = require('./database/database');

const app = express();
const server = http.createServer(app);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}));

sequelize.sync()
  .then(() => {
    app.get('/', (req, res) => {
      res.render('index');
    });

    app.get('/login', (req, res) => {
        res.render('login', { message: null });
      });

    app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      try {
        const user = await User.findOne({ where: { email } });
        if (user && bcrypt.compareSync(password, user.password)) {
          req.session.user = user;
          res.redirect('/home');
        } else {
          res.render('login', { message: 'Incorrect email or password.' });
        }
      } catch (err) {
        console.error(err);
        res.render('login', { message: 'An error occurred. Please try again.' });
      }
    });

    app.get('/register', (req, res) => {
        res.render('register', { message: null }); 
      });

      app.post('/register', async (req, res) => {
        const { username, email, password } = req.body;
        try {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(password, salt);
          const user = await User.create({ username, email, password: hash });
          req.session.user = user;
          res.redirect('/home');
        } catch (err) {
          console.error(err);
          if (err.name === 'SequelizeUniqueConstraintError') {
            res.render('register', { message: 'Username or email already exists.' });
          } else {
            res.render('register', { message: 'Error, please try again.' });
          }
        }
      });
      

      app.get('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/');
      });
      

    app.get('/home', (req, res) => {
      if (req.session.user) {
        res.render('home', { user: req.session.user });
      } else {
        res.redirect('/login');
      }
    });
    

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor Conectado, ${PORT}.`);
});
});
