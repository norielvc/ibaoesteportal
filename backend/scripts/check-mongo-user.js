const path = require('path');
const fs = require('fs');

// Robust env loading
const envPath = path.join(__dirname, '..', '.env');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

const mongoose = require('mongoose');
const User = require('../models/User');

async function checkMongoUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'norielzurc@gmail.com' });
        console.log('--- MongoDB User (Noriel) ---');
        console.log(JSON.stringify(user, null, 2));
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkMongoUser();
