const express = require('express');
const passport = require('passport');
const connection = require('./dbconnection').connection;
const pool = require('./dbconnection').pool;
const itemHistoryInsert = require('./dbconnection').itemHistoryInsert;
const app = express.Router();
const bcrypt = require('bcrypt-nodejs');
const uuidv4 = require('uuid/v4');
const knex = require('./dbconnection').knex;
const reserveItem = require('./reserveHelper').reserveItem;

//ROUTES
//Home
app.get('/', function(req, res) {
    res.render("home");
    console.log("you visited the home page");
});

// Logout
app.get('/logout', checkAuth, function(req, res) {
    console.log(req.user.username + " Logs Out");
    req.session = null;
    res.redirect("/");
});

// ----------------
// INVENTORY routes
// ----------------

//Inventory Page
app.get('/inventory', checkAuth, function(req, res) {
    var passedStuff = req.params.description;
    // var q = 'SELECT * FROM inventory LIMIT 100';

    knex.select('*').from('inventory')
    .orderBy('inv_id','asc')
    .where('remove','=','false')
    .then(results => {
        res.render("inventory/inventory", {items: results,reserving:false});
    })
});

// testing really don't know if this will work.
app.get('/api/inventory/:id/history', checkAuth, function(req, res) {
    var projID = req.params.id;
    knex.select('*').from('inventory_history')
    .where('inv_id','=',projID)
    .then(results => {
        res.send({results})
    })
    .catch(err => console.log(err))
});

app.get('/api/inventory/:id', checkAuth, function(req, res) {
    var projID = req.params.id;
    knex.select('*').from('inventory')
    .where('inv_id','=',projID)
    .then(results => {
        res.send({results})
    })
    .catch(err => console.log(err))
});

app.put('/api/inventory/:id', checkAuth, function(req, res) {
    var itemID = req.params.id;
    // console.log(itemID);
    let itemData = {
        description: res.req.body.description,
        category: res.req.body.category,
        storage_location: res.req.body.storage,
        quantity: res.req.body.quantity,
        remove: res.req.body.remove
    }

    if(res.req.body.present){
        itemData.present = 'yes';
    } else {
        itemData.present = 'no';
    }

    if(res.req.body.reserved){
        itemData.reserved = 'yes';
    } else {
        itemData.reserved = 'no';
    }

    // console.log(projData);

    knex('project_items')
    // .select('reserved')
    .sum('reserved')
    .where('inv_id','=',itemID)
    .then(result =>{
        // console.log(result);
        if(result[0].sum <= itemData.quantity){
            itemData.available = itemData.quantity - result[0].sum;
            knex('inventory')
            .where('inv_id','=',itemID)
            .update(itemData)
            .returning('*')
            .then(result => {
                itemHistoryInsert(result, req.user.username,'modified item');
                res.send({response: "Good"})
            })
        } else {
            res.status(500).send({error: 'Quantity is less than available.'})
        }

    })

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
    insertQuery(item,req.user.username);
    res.redirect("/inventory");
});

// --------------
// SEARCH routes
// --------------
// Show search form
app.get('/search/new', checkAuth, function(req, res) {
    knex.select('category').from('inventory')
    .distinct('category')
    .then(categories => {
        res.render('search', {categories: categories})
    })
    .catch(err => {
        console.log(err)
    })
});

// Query the database
app.post('/search', checkAuth, function(req, res) {
    var query = req.body.query;
    if(query.category === 'Any'){
        var q = knex.select('*').from('inventory')
        .where('description', 'like', `%${query.description}%`)
        .andWhere('remove','=','false')
        .orderBy('inv_id', 'asc')
        .then(results => {
            res.render('inventory/inventory', {items: results,reserving:false});
        })
        .catch(err => {
            console.log(err)
        })
    }else{
        knex.select('*').from('inventory')
        .where('description', 'like', `%${query.description}%`)
        .andWhere('category', query.category)
        .andWhere('remove','=','false')
        .orderBy('inv_id','asc')
        .then(results => {
            res.render('inventory/inventory', {items: results,reserving:false})
        })
        .catch(err => {
            console.log(err)
        })
    }

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

function checkAuth(req, res, next){
    if(req.isAuthenticated()){
        next();
    } else {
        res.redirect('/login');
    }
}

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
            res.render("users/user_accounts", {items: results});
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
        res.render("users/account", {info: results});
    });
});

app.post('/signup', async function(req, res){
    const data = {
        id: uuidv4(),
        email: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    }
    await bcrypt.hash(req.body.password, null, null, async function(err,hash){
        knex('users')
        .select('id')
        .where('email','=',data.email)
        .then(result => {
            if(result[0]){
                res.redirect('/signup')
            } else {
                data.password = hash;
                knex('users')
                .insert(data)
                .then(res.redirect('/login'))
                .catch(err => console.log(err, 'Error creatign new user'))
            }
        })
    })
});


// -----------------------------
// PROJECT Routes
// -----------------------------
// Show list of all projects
app.get('/projects', function(req, res) {
    var passedStuff = req.params.description;
    knex('project')
    .select('*')
    .orderBy('proj_id','asc')
    .then(pResults =>{
        knex('users')
        .select('id')
        .then(uResults => {
            res.render('projects', {projects: pResults,id:req.user.id,managers:uResults})
        })
    })
});

// New project form
app.get('/projects/new', function(req,res){
    res.render("newProject");
});

// Shows inventory(reserved items) for specific project
app.get('/api/projects/:id/items', checkAuth, function(req, res) {
    var projID = req.params.id;
    knex('project_items')
    .join('inventory','project_items.inv_id','=','inventory.inv_id')
    .where('project_items.proj_id','=',projID)
    .andWhere('inventory.remove','=','false')
    // .select('inventory.description','inventory.category','inventory.quantity',
    // 'inventory.quantity','project_items.reserved')
    .then(results => {
        res.send({results});
    })
});

app.get('/api/projects/:id/', checkAuth, function(req, res) {
    var projID = req.params.id;
    knex.select('*').from('project')
    .where('proj_id','=',projID)
    .then(results => {
        res.send({results})
    })
    .catch(err => console.log(err))
});

// Add new project to database and redirect to list of all projects
app.put('/api/projects/:id',checkAuth,function(req,res){
    let projID = req.params.id;

    let projData = {
        manager_id: res.req.body.manager,
        name: res.req.body.name
    }

    knex('project')
    .where('proj_id','=',projID)
    .update(projData)
    .returning('*')
    .then(result => {
        // console.log(result);
        // res.redirect(303, '/inventory')
        res.send({response:'Good'})
    })
    .catch(err => {
        console.log(err, 'Error updating project.')
        res.status(500).send({error: 'Error updating project information.'})
    })
})

app.post('/projects', checkAuth, function(req,res){
    let data = {
        manager_id: req.user.id,
        name: req.body.name
    }
    // console.log(data);
    // console.log(req.body.name);

    knex('project')
    .insert(data)
    .then(result => {
        console.log(result);
        res.redirect('/projects')
    })
});

// ------------------
// STATISTICS
// ------------------
app.get('/statistics', checkAuth, function(req, res) {
    // res.render('statistics');
    knex('inventory')
    .count('category')
    .select('category')
    .where('remove','=',false)
    .groupBy('category')
    .then(results =>{
        res.render('statistics', {categories:results})
    })
    // SELECT category, count(*) FROM inventory
    // GROUP BY category;
});

// allows reservation of items for a specific project
app.get('/projects/:id/reserve',checkAuth,function(req,res){
    // knex.select('*').from('inventory')
    // .orderBy('inv_id','asc')
    // .where('remove','=','false')
    // .then(results => {
    //     res.render("reserve", {items: results,projectID: req.params.id});
    // })
    knex('project')
    .select('proj_id')
    .where('proj_id','=',req.params.id)
    .then(result => {
        if(result.length > 0){
            knex.select('*').from('inventory')
            .orderBy('inv_id','asc')
            .where('remove','=','false')
            .then(results => {
                res.render("reserve", {items: results,projectID: req.params.id});
            })
        } else {
            res.statusMessage = `Project ID: ${req.params.id} not found.`
            // res.status(404).end();
            res.send(404,`Project ID: ${req.params.id} not found.`)
        }
    })
    .catch(err =>{
        console.log('Error: ',err);
        res.redirect('/');
    })
});

app.put('/api/projects/:pid/reserve/:iid',checkAuth,function(req,res){
    // console.log('ProjectID: ',req.params.pid);
    // console.log('ItemID: ',req.params.iid);
    // console.log('ReserveAmt: ',res.req.body.reserve);

    const reserveItemIfPossible = reserveItem(req.params.pid,
        req.params.iid,res.req.body.reserve)

    if(reserveItemIfPossible)
        res.send({response:'Good'})
    else
        res.status(500).send({error:'Something went wrong.'})

})

//Query generator functions
//Generates a query for inserting a new item
function insertQuery(item,user) {
    present = (item.present === 'on') ? 'yes' : 'no';
    reserved = (item.reserved === 'on') ? 'yes' : 'no';

    let data = {
        description: item.description,
        category: item.category,
        date_recieved: 'NOW()',
        storage_location: item.storage_location,
        present: present,
        reserved: reserved
    }

    knex('inventory')
    .insert(data)
    .returning('*')
    .then(result => {
        // console.log(result);
        itemHistoryInsert(result, user,'created item')
    })
    .catch(err => console.log(err, 'Error in item creation'))
}

module.exports = app;
