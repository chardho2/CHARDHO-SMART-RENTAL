const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    type: {
        type: String,
        enum: ['popular', 'recent', 'saved'],
        default: 'popular'
    },
    category: {
        type: String,
        enum: ['airport', 'railway', 'metro', 'landmark', 'restaurant', 'hotel', 'hospital', 'other'],
        default: 'other'
    },
    isActive: { type: Boolean, default: true },
    searchCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Indexes for faster queries
// Geospatial index for radius-based searches (e.g., find locations within 20km)
locationSchema.index({ coordinates: '2dsphere' });

// Compound indexes for common query patterns
locationSchema.index({ city: 1, type: 1, isActive: 1 }); // Popular locations by city
locationSchema.index({ type: 1, isActive: 1, searchCount: -1 }); // Trending locations
locationSchema.index({ category: 1, isActive: 1 }); // Locations by category

// Text search index for location search
locationSchema.index({ name: 'text', address: 'text', city: 'text' });

// Index for search count (trending)
locationSchema.index({ searchCount: -1 });

module.exports = mongoose.model('Location', locationSchema);
