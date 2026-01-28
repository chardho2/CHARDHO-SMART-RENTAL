const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    profilePicture: {
        type: String,
        default: null
    },

    // Driver-specific fields
    isOnline: {
        type: Boolean,
        default: false
    },

    vehicle: {
        type: {
            type: String,
            enum: ['bike', 'auto', 'car', 'suv'],
            required: false  // Optional field
        },
        model: {
            type: String,
            required: false
        },
        plateNumber: {
            type: String,
            required: false
        },
        color: {
            type: String,
            required: false
        },
        year: {
            type: Number,
            required: false
        }
    },

    location: {
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        },
        // GeoJSON for 2dsphere indexing
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        },
        lastUpdated: {
            type: Date,
            default: null
        }
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

    totalEarnings: {
        type: Number,
        default: 0
    },

    // For calculating average rating
    totalRatings: {
        type: Number,
        default: 0
    },

    ratingSum: {
        type: Number,
        default: 0
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },

    // Bank Details
    bankDetails: {
        accountNumber: {
            type: String,
            default: null
        },
        ifscCode: {
            type: String,
            default: null
        },
        accountHolderName: {
            type: String,
            default: null
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'failed'],
            default: 'pending'
        },
        verifiedAt: {
            type: Date,
            default: null
        },
        beneficiaryId: {
            type: String,
            default: null
        }
    },

    // Documents
    documents: {
        license: {
            type: String,
            default: null
        },
        aadhar: {
            type: String,
            default: null
        },
        vehicleRC: {
            type: String,
            default: null
        }
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // Refresh tokens for multi-device login
    refreshTokens: [{
        token: {
            type: String,
            required: true
        },
        deviceId: {
            type: String,
            required: true
        },
        deviceName: {
            type: String,
            default: 'Unknown Device'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    emergencyContacts: [{
        name: { type: String, required: true },
        number: { type: String, required: true },
        relation: { type: String, required: true }
    }],

    // Native Razorpay QR Details
    razorpayQrId: {
        type: String,
        default: null
    },
    razorpayQrImageUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
driverSchema.pre('save', async function (next) {
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
driverSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update rating
driverSchema.methods.updateRating = function (newRating) {
    this.totalRatings += 1;
    this.ratingSum += newRating;
    this.rating = this.ratingSum / this.totalRatings;
};

// Don't return password in JSON
driverSchema.methods.toJSON = function () {
    const driver = this.toObject();
    delete driver.password;
    return driver;
};

// Indexes for faster queries
// Geospatial index for location-based driver matching
driverSchema.index({ 'location.coordinates': '2dsphere' });

// Compound index for finding online drivers
driverSchema.index({ isOnline: 1, 'location.coordinates': '2dsphere' });

// Unique indexes for authentication
driverSchema.index({ email: 1 }, { unique: true });
driverSchema.index({ phone: 1 }, { unique: true });

// Index for rating queries
driverSchema.index({ rating: -1 }); // Sort by rating

// Index for verification status
driverSchema.index({ isVerified: 1 });

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
