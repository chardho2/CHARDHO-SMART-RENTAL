const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    profilePicture: {
        type: String,
        default: null
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    // Legacy fields for driver migration support
    isOnline: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
    userType: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
    vehicle: {
        type: { type: String, enum: ['bike', 'auto', 'car', 'suv'] },
        model: String,
        plateNumber: String,
        color: String,
        year: Number
    },
    location: {
        latitude: Number,
        longitude: Number,
        lastUpdated: Date
    },
    rating: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },

    // Session Management
    refreshTokens: [{
        token: { type: String, required: true },
        deviceId: { type: String, required: true },
        deviceName: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    emergencyContacts: [{
        name: { type: String, required: true },
        number: { type: String, required: true },
        relation: { type: String, required: true }
    }]
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to exclude password from JSON response
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
