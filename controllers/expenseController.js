const sequelize = require('../config/database'); 
const Expense = require('../models/Expense');
const User = require('../models/User');

exports.addExpense = async (req, res) => {
    let trans; 
    try {
        const { amount, description, category , expense_date } = req.body;
        const userId = req.session.userId;

        trans = await sequelize.transaction();

        await Expense.create({
            amount,
            description,
            category,
            expense_date: expense_date || new Date(),
            user_id: userId
        }, { transaction: trans });

        await User.increment('totalExpenses', { 
            by: parseFloat(amount), 
            where: { id: userId }, 
            transaction: trans
        });

        await trans.commit();
        res.status(201).json({ message: 'Expense added successfully' });
    } catch (error) {
        if (trans) await trans.rollback();
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
    let trans;
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        trans = await sequelize.transaction();

        const expense = await Expense.findOne({ 
            where: { id, user_id: userId },
            transaction: trans 
        });

        if (!expense) {
            await trans.rollback();
            return res.status(404).json({ message: 'Expense not found' });
        }

        await User.increment('totalExpenses', { 
            by: -parseFloat(expense.amount),
            where: { id: userId },
            transaction: trans 
        });

        await expense.destroy({ transaction: trans });

        await trans.commit(); 
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        if (trans) await trans.rollback();
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
};

