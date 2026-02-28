const mongoose = require('mongoose');

const recentSearchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        name: String,
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    searchedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
recentSearchSchema.index({ user: 1, searchedAt: -1 });

// Auto-delete old searches (keep only last 10 per user)
recentSearchSchema.pre('save', async function (next) {
    const RecentSearch = this.constructor;
    const count = await RecentSearch.countDocuments({ user: this.user });

    if (count >= 10) {
        // Delete oldest searches
        const oldSearches = await RecentSearch.find({ user: this.user })
            .sort({ searchedAt: 1 })
            .limit(count - 9);

        await RecentSearch.deleteMany({
            _id: { $in: oldSearches.map(s => s._id) }
        });
    }

    next();
});

module.exports = mongoose.model('RecentSearch', recentSearchSchema);
