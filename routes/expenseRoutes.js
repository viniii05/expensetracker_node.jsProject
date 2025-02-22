const express = require('express');
const expenseController = require('../controllers/expenseController'); // ✅ Make sure this path is correct

const router = express.Router();

router.post('/add', expenseController.addExpense); // ✅ Ensure this function is correctly imported
router.get('/list', expenseController.getExpenses);
router.delete('/delete/:id', expenseController.deleteExpense);

module.exports = router;
