try {
    const auth = require('./routes/auth');
    console.log('✅ Auth route loaded successfully');
} catch (error) {
    console.error('❌ Error loading auth route:', error);
}
