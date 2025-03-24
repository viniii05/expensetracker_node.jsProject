const Expense = require('../models/Expense');
const User = require('../models/User');
const DownloadHistory = require('../models/DownloadHistory');
require('dotenv').config();
const S3service = require('../services/S3services');
const mongoose = require('mongoose');

exports.getDownloadReport = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('expenses');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stringifiedExpenses = JSON.stringify(user.expenses);
        const fileName = `expenses_${user._id}_${Date.now()}.txt`;
        const fileURL = await S3service.uploadToS3(stringifiedExpenses, fileName);

        await new DownloadHistory({ userId: user._id, fileURL }).save();

        res.status(200).json({ fileURL, success: true });
    } catch (error) {
        console.error('Error fetching download report:', error);
        res.status(500).json({ message: 'Error fetching download report' });
    }
};

exports.getDownloadHistory = async (req, res) => {
    try {
        const history = await DownloadHistory.find({ userId: req.session.userId }).sort({ downloadedAt: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching download history' });
    }
};

exports.addExpense = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { amount, description, category, expense_date } = req.body;

        if (!amount || !description || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userId = new mongoose.Types.ObjectId(req.session.userId);

        const expense = new Expense({
            amount: parseFloat(amount),
            description,
            category,
            expense_date: expense_date ? new Date(expense_date) : new Date(),
            userId
        });

        await expense.save();

        await User.findByIdAndUpdate(userId, { $inc: { totalExpenses: parseFloat(amount) } });

        res.status(201).json({ message: 'Expense added successfully', expense });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error adding expense', error: error.message });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        console.log("Session userId:", req.session.userId);

        let userId;
        if (typeof req.session.userId === "string" && mongoose.isValidObjectId(req.session.userId)) {
            userId = new mongoose.Types.ObjectId(req.session.userId); 
        } else {
            console.error("Invalid userId format:", req.session.userId);
            return res.status(400).json({ message: "Invalid userId format" });
        }

        const expenses = await Expense.find({ userId }).sort({ createdAt: -1 });

        console.log("Expenses fetched:", expenses.length);

        const formattedExpenses = expenses.map(exp => ({
            id: exp._id.toString(),
            userId: exp.userId.toString(),
            amount: exp.amount,
            description: exp.description,
            category: exp.category,
            expense_date: exp.expense_date ? exp.expense_date.toISOString().split('T')[0] : exp.createdAt.toISOString().split('T')[0],
            createdAt: exp.createdAt,
            updatedAt: exp.updatedAt
        }));

        res.json(formattedExpenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Error fetching expenses", error: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.session.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = new mongoose.Types.ObjectId(req.session.userId);

        const expense = await Expense.findOneAndDelete({ _id: id, userId }); 

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await User.findByIdAndUpdate(userId, { $inc: { totalExpenses: -parseFloat(expense.amount) } });

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense', error: error.message });
    }
};