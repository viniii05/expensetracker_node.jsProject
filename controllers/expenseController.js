const sequelize = require('../config/database'); 
const Expense = require('../models/Expense');
const User = require('../models/User');
const DownloadHistory = require('../models/DownloadHistory');  // Ensure this is imported
require('dotenv').config();
const S3service = require('../services/S3services');


exports.getDownloadReport = async (req, res) => {
    try {
        const user = await User.findByPk(req.session.userId, {
            include: Expense,
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const expenses = user.Expenses;
        const stringifiedExpenses = JSON.stringify(expenses);
        const fileName = `expenses_${user.id}_${Date.now()}.txt`;

        const fileURL = await S3service.uploadToS3(stringifiedExpenses, fileName);

        await DownloadHistory.create({
            user_id: user.id,  // ✅ Correct reference to user ID
            fileURL
        });
        

        res.status(200).json({ fileURL, success: true });
    } catch (error) {
        console.error('Error fetching download report:', error);
        res.status(500).json({ message: 'Error fetching download report' });
    }
};

exports.getDownloadHistory = async (req, res) => {
    try {
        const userId = req.session.userId;

        const history = await DownloadHistory.findAll({
            where: { user_id: userId },
            order: [['downloadedAt', 'DESC']]
        });

        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching download history:', error);
        res.status(500).json({ message: 'Error fetching download history' });
    }
};



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

