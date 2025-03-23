const mongoose = require('mongoose');

const downloadHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileURL: { type: String, required: true },
    downloadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DownloadHistory', downloadHistorySchema);
