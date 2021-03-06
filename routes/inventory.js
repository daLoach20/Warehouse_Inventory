const express = require('express')
const router = express.Router()
const checkAuth = require('../helpers').checkAuth;
const checkAccess = require('../helpers').checkAccess;
const knex = require('../dbconnection').knex;
const insertQuery = require('../dbconnection').insertQuery;
const logger = require('../logging').logger;

// ----------------
// INVENTORY routes
// ----------------

//Inventory Page
router.get('/inventory', checkAuth, checkAccess, function(req, res) {
    var passedStuff = req.params.description;

    knex.select('*').from('inventory')
    .orderBy('inv_id','asc')
    .where('remove','=','false')
    .then(results => {
        res.render("inventory/inventory", {
            items: results,reserving:false,
            access: req.user.access
        });
    })
});

//Inventory Page for all items
router.get('/inventory/all', checkAuth, checkAccess,function(req, res) {
    var passedStuff = req.params.description;
    // var q = 'SELECT * FROM inventory LIMIT 100';

    knex.select('*').from('inventory')
    .orderBy('inv_id','asc')
    .then(results => {
        res.render("inventory/inventory", {
            items: results,reserving:false,
            access: req.user.access
        });
    })
});

//New Item page
router.get('/inventory/new', checkAuth, checkAccess,function(req, res) {
    res.render("inventory/newItem");
});

//Add new item to DB
router.post('/inventory', checkAuth, checkAccess,function(req, res) {
    var item = req.body.item;
    logger('/inventory POST: Adding new item to DB')
    insertQuery(item,req.user.username);
    res.redirect("/inventory");
});
module.exports = router;
