const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    totalExpenses: { type: Number, default: 0 },
    isPremiumUser: { type: Boolean, default: false },
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
