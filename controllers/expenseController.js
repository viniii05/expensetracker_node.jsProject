const Expense = require('../models/Expense');

exports.isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

exports.addExpense = async (req, res) => {
    try {
        const { amount, description, category } = req.body;
        await Expense.create({
            amount,
            description,
            category,
            user_id: req.session.userId
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
            order: [['id', 'DESC']] // ✅ Use `id` instead of `createdAt`
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

        const expense = await Expense.findOne({ where: { id, user_id: req.session.userId } });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await expense.destroy();
        console.log(` Expense ID ${id} deleted successfully`);
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
};


