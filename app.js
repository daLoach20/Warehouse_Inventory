/*
Authors: Jake Edwards & John Carvajal
Class: CSC 425-001
Professor: Dr. Sawadpong
Project: 
Team: TeamIDK
*/

var express    = require('express');
var mysql      = require('mysql');
var faker      = require('faker');
var bodyParser = require('body-parser');

var app = express();

//Setup
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//Connect to MySQL database with the correct user info and which database is to be used
var connection = mysql.createConnection({
  host      : 'localhost',
  user      : 'root',
  password  : 'jakejohn',
  database  : 'warehouse_inventory'
});

//Connect to warehouse_inventory DB
connection.connect();

//ROUTES
//Home
app.get('/', function(req, res) {
  res.render("home");
  console.log("you visited the home page");
});

//New Item page
app.get('/inventory/new', function(req, res) {
  res.render("newItem");
  console.log("you visited the new item page");
});

//Add new item to DB
app.post('/inventory', function(req, res) {
  var item = req.body.item;
  console.log("inventory post route...now adding new item to DB");
  var q = insertQuery(item);
  console.log(q);
  connection.query(q, function(err, results) {
    if(err) throw err;
  });  
  res.redirect("/inventory");
});


//The inventory page where the database will be shown
app.get('/inventory', function(req, res) {
  var passedStuff = req.params.description;
  //console.log(passedStuff);
  //Query to get the data
  var q = 'SELECT * FROM inventory LIMIT 100';
  connection.query(q, function(err, results) {
    if(err) throw err;
    
    //Send the rendered page
    res.render("inventory", {items: results});
  });  
});

//The server
app.listen(3000, function() {
  console.log("The server has started");
});

//Query generator functions
//Generates a query for inserting a new item
function insertQuery(item) {
  var q = 'INSERT INTO inventory(description, category, date_recieved, storage_location, present, reserved)' +
          'VALUES(';
  q += '"' + item.description + '", ';
  q += '"' + item.category + '", ';
  q += 'NOW(), ';
  q += item.storage_location + ', ';
  
  if(item.present === 'on') {
    q += '"yes", ';
  } else {
    q += '"no", ';
  }  
  
  if(item.reserved === 'on') {
    q += '"yes");';
  } else {
    q += '"no");';
  }
  
  return q;
}








//Generate fake data
// var fake_data = [];
// for(var i = 0; i < 1000; i++) {
//   fake_data.push([
//     faker.commerce.productName(),
//     faker.commerce.productAdjective(),
//     faker.date.past(),
//     faker.random.number(),
//     faker.random.boolean(),
//     faker.random.boolean()
//   ]);
// }

//Load warehouse_inventory DB with fake_data as provided by faker.js
// var q = 'INSERT INTO inventory(description, category, date_recieved, storage_location, present, reserved) VALUES ?';
// connection.query(q, [fake_data], function(err, result) {
//   console.log('Error is ' + err);
//   console.log(result);
// });

//Test query
// connection.query('SELECT date_recieved FROM inventory AS date', function(error, results, fields) {
//   if(error) throw error;
//   console.log(results[0]);
// });

//Close the DB connection
//connection.end();


