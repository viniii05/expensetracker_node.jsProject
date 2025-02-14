const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

const isAuthenticated = expenseController.isAuthenticated;

router.post('/add', isAuthenticated, expenseController.addExpense);
router.delete('/delete/:id', isAuthenticated, expenseController.deleteExpense);
router.get('/list', isAuthenticated, expenseController.getExpenses);


module.exports = router;
