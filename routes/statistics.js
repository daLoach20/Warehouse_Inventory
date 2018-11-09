const express = require('express')
const router = express.Router();
const checkAuth = require('../helpers').checkAuth;
const knex = require('../dbconnection').knex;

// ------------------
// STATISTICS
// ------------------
router.get('/', checkAuth, function(req, res) {
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
module.exports = router;