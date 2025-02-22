const Expense = require('../models/Expense');
const User = require('../models/User');

exports.addExpense = async (req, res) => {
    try {
        const { amount, description, category } = req.body;
        const userId = req.session.userId; // Get user ID from session


        await Expense.create({
            amount,
            description,
            category,
            user_id: req.session.userId
        });
        await User.increment('totalExpenses', { 
            by: parseFloat(amount), 
            where: { id: userId } 
        });

        res.status(201).json({ message: 'Expense added successfully' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error adding expense' });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            where: { user_id: req.session.userId },
            order: [['id', 'DESC']]
        });

        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId; // Get user ID from session


        const expense = await Expense.findOne({ where: { id, user_id: req.session.userId } });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await User.increment('totalExpenses', { 
            by: -parseFloat(expense.amount), // Subtracting
            where: { id: userId } 
        });

        await expense.destroy();
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
};
