const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    userType: {
        type: String,
        enum: ['user', 'driver'],
        default: 'user'
    },
    role: {
        type: String,
        enum: ['user', 'driver'],
        default: 'user'
    },
    vehicleNumber: {
        type: String,
        trim: true
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    // Driver-specific fields
    vehicle: {
        type: {
            type: String,
            enum: ['bike', 'auto', 'car', 'suv', null], // Allow null explicitly
            default: null
        },
        model: { type: String, default: null },
        plateNumber: { type: String, default: null },
        color: { type: String, default: null },
        year: { type: Number, default: null }
    },
    location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        lastUpdated: { type: Date, default: null }
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRides: {
        type: Number,
        default: 0
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    avatar: {
        type: String,
        default: null
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    documents: [{
        type: {
            type: String,
            enum: ['license', 'insurance', 'rc', 'aadhar', 'other']
        },
        url: String,
        verified: {
            type: Boolean,
            default: false
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Session Management
    refreshTokens: [{
        token: { type: String, required: true },
        deviceId: { type: String, required: true },
        deviceName: { type: String, required: true }, // e.g., "iPhone 13", "Chrome Windows"
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Method to exclude password from JSON response
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
