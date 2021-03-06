const express = require('express')
const router = express.Router();
const checkAuth = require('../helpers').checkAuth;
const checkAccess = require('../helpers').checkAccess;
const knex = require('../dbconnection').knex;

// ------------------
// STATISTICS
// ------------------

// statistics page
router.get('/statistics', checkAuth, checkAccess,function(req, res) {
    knex('inventory')
    .count('category')
    .select('category')
    .where('remove','=',false)
    .groupBy('category')
    .then(numItemsPerCategory => {
        knex('inventory')
        .countDistinct('category')
        .where('remove', '=', false)
        .then(totalCategories => {
            knex('inventory')
            .sum('quantity')
            .where('remove', '=', false)
            .then(quantity => {
                knex('inventory')
                .count()
                .select('date_recieved')
                .where('remove', '=', false)
                .groupBy('date_recieved')
                .limit(20)
                .orderBy('date_recieved', 'desc')
                .then(dates => {
                    res.render('statistics', {numItemsPerCategory:numItemsPerCategory, totalCategories: totalCategories, quantity: quantity, dates: dates});
                });
            });
        });
    })
});
module.exports = router;
