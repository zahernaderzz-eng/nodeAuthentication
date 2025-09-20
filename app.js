const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI =
  'mongodb+srv://zahernaderzz_db_user:C0zvKSqUfcruIjhO@cluster0.juvjoh6.mongodb.net/shop?retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// ✅ Express built-in parsers
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

// ✅ Debugging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('📋 Body:', req.body);
  }
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

// ✅ Clean connection - no deprecated options needed
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    console.log('✅ Connected to MongoDB successfully!');

    // ✅ Test database write
    console.log('🧪 Testing database write...');
    const testUser = new User({
      email: 'test@example.com',
      password: 'testpass123',
      cart: { items: [] }
    });

    return testUser.save();
  })
  .then(savedUser => {
    console.log('✅ Test user saved successfully:', savedUser._id);
    // Delete test user
    return User.deleteOne({ email: 'test@example.com' });
  })
  .then(() => {
    console.log('🗑️ Test user deleted');
    console.log('🚀 Server starting on port 3000...');
    app.listen(3000, () => {
      console.log('✅ Server is running on http://localhost:3000');
    });
  })
  .catch(err => {
    console.log('❌ Database error:', err);
  });