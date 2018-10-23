const express = require('express');
const passport = require('passport');
const connection = require('./dbconnection').connection;
const pool = require('./dbconnection').pool;
const app = express.Router();
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');

//ROUTES
//Home
app.get('/', function(req, res) {
    res.render("home");
    console.log("you visited the home page");
});

// Logout
app.get('/logout', checkAuth, function(req, res) {
    console.log(req.user.username + " Logs Out");
    req.session.destroy(function() {
        res.redirect('/');
    });

});

// ----------------
// INVENTORY routes
// ----------------

//Inventory Page
app.get('/inventory', checkAuth, function(req, res) {
    var passedStuff = req.params.description;
    var q = 'SELECT * FROM inventory LIMIT 100';

    connection.query(q, function(err, results) {
      if(err) throw err;
      res.render("inventory/inventory", {items: results});
    });
});

//New Item page
app.get('/inventory/new', checkAuth, function(req, res) {
    res.render("inventory/newItem");
    console.log("you visited the new item page");
});

//Add new item to DB
app.post('/inventory', checkAuth, function(req, res) {
  var item = req.body.item;
  console.log("inventory post route...now adding new item to DB");
  var q = insertQuery(item);
  console.log(q);
  connection.query(q, function(err, results) {
    if(err) throw err;
  });
  res.redirect("inventory/inventory");
});


// --------------
// AUTH routes
// --------------
//Login page
app.get('/login', function(req, res, next){
    //Special Case: If user is already logged in, redirect to the home page.
      if(req.isAuthenticated()){
        res.redirect('/');
      } else {
        res.render('users/login');
      }
});

/*
app.get('/login', passport.authenticate('local', {failureRedirect: '/login'}),function(req, res, next){
  res.redirect('/');
});*/

//Testing
/*
app.get('/login', checkAuth,function(req, res, next){
  res.redirect('/');
});
*/

function checkAuth(req, res, next){
  if(req.isAuthenticated()){
    next();
  } else {
    res.redirect('/login');
  }
}


//passport.authenticate works here for some reason but not others
//Submit Login Page
// app.post('/login', passport.authenticate('local', {
//   successRedirect: 'users/account',
//   failureRedirect: '/login',
//   });
// });

app.post('/login', passport.authenticate('local', {
    successRedirect: '/account',
    failureRedirect: '/login'
}));

//Users Table. TODO: take at least some data out of production
app.get('/user_accounts', function(req, res) {

  if(req.isAuthenticated()){
    var passedStuff = req.params.description;
    //Query to get the data
    var q = 'SELECT * FROM users ORDER BY id';
    connection.query(q, function(err, results) {
      if(err) throw err;

      //Send the rendered page
      //console.log(results);
      res.render("auth/user_accounts", {items: results});
    });
  } else {
    res.redirect('/');
  }
});

//signup page
app.get('/signup', function(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/account');
  } else {
    res.render("users/signup", {title: "Register", userData: req.user});
  }
});

app.get('/account', checkAuth, function(req, res, next){
    var q = 'SELECT * FROM users WHERE "id"=$1';
    connection.query(q, [req.user.id], function(err, results) {
        //console.log("q", [req.user.id], q);
        //console.log("results", results);
        res.render("users/account", {info: results});
    });
});

app.post('/signup', async function(req, res){
  try{
    const dbclient = await pool.connect()
    await dbclient.query('BEGIN')
    var pwd = await bcrypt.hash(req.body.password, 5);
    await JSON.stringify(dbclient.query('SELECT id FROM "users" WHERE "email"=$1',
  [req.body.username], function(err, result){
    if(result.rows[0]){
      res.redirect('/signup');
    }
    else{
      dbclient.query('INSERT INTO users (id, "firstName", "lastName", email, password) VALUES ($1, $2, $3, $4, $5)',
    [uuidv4(), req.body.firstName, req.body.lastName, req.body.username, pwd],
  function(err, result){
    if(err){
      console.log(err);
    }
    else{
      dbclient.query('COMMIT')
      //console.log(result)
      res.redirect('/login');
      return;
    }
  });
    }
  }));
  dbclient.release();

}
  catch(e){throw(e)}
});

//The inventory page where the database will be shown
/*
app.get('/inventory', passport.authenticate('local', {failureRedirect: '/'}),function(req, res, next){
  var passedStuff = req.params.description;
  var q = 'SELECT * FROM inventory LIMIT 100';
  connection.query(q, function(err,results){
    if(err) throw err;
    res.render("inventory", {items: results});
  });
});*/



/*
app.get('/user_accounts',
  passport.authenticate('local', {failureRedirect: '/'}),
    function(req, res) {
    var passedStuff = req.params.description;
    //Query to get the data
    var q = 'SELECT * FROM user_account ORDER BY user_id';
    connection.query(q, function(err, results) {
      if(err) throw err;
      //Send the rendered page
      //console.log(results);
      res.render("user_accounts", {items: results});
    });
});*/

app.get('/items', function(req, res) {
  var passedStuff = req.params.description;
  //console.log(passedStuff);
  //Query to get the data
  var q = 'SELECT * FROM item ORDER BY item_id';
  connection.query(q, function(err, results) {
    if(err) throw err;

    //Send the rendered page
    //console.log(results);
    res.render("items", {items: results});
  });
});

app.get('/projects', function(req, res) {
  var passedStuff = req.params.description;
  //console.log(passedStuff);
  //Query to get the data
  var q = 'SELECT * FROM project ORDER BY project_id';
  connection.query(q, function(err, results) {
    if(err) throw err;

    //Send the rendered page
    //console.log(results);
    res.render("projects", {items: results});
  });
});

//Query generator functions
//Generates a query for inserting a new item
function insertQuery(item) {
  var q = 'INSERT INTO inventory(description, category, date_recieved, storage_location, present, reserved)' +
          'VALUES(';
  q += '\'' + item.description + '\', ';
  q += '\'' + item.category + '\', ';
  q += 'NOW(), ';
  q += item.storage_location + ', ';

  if(item.present === 'on') {
    q += '\'yes\', ';
  } else {
    q += '\'no\', ';
  }

  if(item.reserved === 'on') {
    q += '\'yes\');';
  } else {
    q += '\'no\');';
  }

  return q;
}

module.exports = app;
