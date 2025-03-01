const express = require('express');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

router.post('/add', expenseController.addExpense); 
router.get('/list', expenseController.getExpenses);
router.delete('/delete/:id', expenseController.deleteExpense);

router.get('/download-history', expenseController.getDownloadHistory);


module.exports = router;
