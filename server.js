const express = require('express')
const app = express()
const session = require('express-session')
const MongoStore = require('connect-mongo');
const nocache = require('nocache')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config()
const StatusCodes = require('./utils/statusCode');

const passport = require('passport');

const adminRoute = require('./routes/admin')
const authRoutes = require('./routes/authRoute')
const userRoute = require('./routes/user')
const connectDB = require('./config/connectDB');

app.set('views', path.join(__dirname, "view"))
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.use(express.json())
app.use(nocache())

app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  },
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/myDatabase',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60
  })
}));



app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

app.use('/', userRoute)

app.use('/admin', adminRoute)


connectDB();

app.use((req, res, next) => {
  res.status(404).render('admin/404');
});

const port=process.env.PORT

app.listen(port, () => {
  console.log('server running on port ', port);
})


