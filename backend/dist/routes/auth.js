"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const database_1 = require("../config/database");
const router = express_1.default.Router();
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await (0, firebase_1.verifyIdToken)(idToken);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
router.post('/register', async (req, res) => {
    try {
        const { idToken, userType, profileData } = req.body;
        if (!idToken || !userType || !profileData) {
            return res.status(400).json({
                error: 'Missing required fields: idToken, userType, profileData'
            });
        }
        if (!['customer', 'sitter'].includes(userType)) {
            return res.status(400).json({
                error: 'Invalid userType. Must be "customer" or "sitter"'
            });
        }
        const decodedToken = await (0, firebase_1.verifyIdToken)(idToken);
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email;
        if (!email) {
            return res.status(400).json({ error: 'Email not found in token' });
        }
        const existingUser = await (0, database_1.query)('SELECT id FROM users WHERE firebase_uid = $1 OR email = $2', [firebaseUid, email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }
        await (0, database_1.query)('BEGIN');
        try {
            const userResult = await (0, database_1.query)('INSERT INTO users (firebase_uid, email, user_type) VALUES ($1, $2, $3) RETURNING id', [firebaseUid, email, userType]);
            const userId = userResult.rows[0].id;
            if (userType === 'customer') {
                const { fullName, dateOfBirth, area, city } = profileData;
                if (!fullName || !dateOfBirth || !area || !city) {
                    throw new Error('Missing required customer fields: fullName, dateOfBirth, area, city');
                }
                await (0, database_1.query)('INSERT INTO customers (user_id, full_name, date_of_birth, area, city) VALUES ($1, $2, $3, $4, $5)', [userId, fullName, dateOfBirth, area, city]);
            }
            else if (userType === 'sitter') {
                const { fullName, age, dateOfBirth, area, city, hoursPerWeek, sitterType, experience } = profileData;
                if (!fullName || !age || !dateOfBirth || !area || !city || !hoursPerWeek || !sitterType) {
                    throw new Error('Missing required sitter fields');
                }
                await (0, database_1.query)('INSERT INTO sitters (user_id, full_name, age, date_of_birth, area, city, hours_per_week, sitter_type, experience) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [userId, fullName, age, dateOfBirth, area, city, hoursPerWeek, sitterType, experience]);
            }
            await (0, database_1.query)('COMMIT');
            return res.status(201).json({
                message: 'User registered successfully',
                userId,
                userType
            });
        }
        catch (error) {
            await (0, database_1.query)('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            error: 'Registration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/login', verifyToken, async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;
        const email = req.user?.email;
        const userResult = await (0, database_1.query)('SELECT id, user_type, created_at FROM users WHERE firebase_uid = $1', [firebaseUid]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        let profile = null;
        if (user.user_type === 'customer') {
            const customerResult = await (0, database_1.query)('SELECT * FROM customers WHERE user_id = $1', [user.id]);
            profile = customerResult.rows[0];
        }
        else if (user.user_type === 'sitter') {
            const sitterResult = await (0, database_1.query)('SELECT * FROM sitters WHERE user_id = $1', [user.id]);
            profile = sitterResult.rows[0];
        }
        return res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email,
                userType: user.user_type,
                createdAt: user.created_at
            },
            profile
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Login failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;
        const userResult = await (0, database_1.query)('SELECT id, user_type, created_at FROM users WHERE firebase_uid = $1', [firebaseUid]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        let profile = null;
        if (user.user_type === 'customer') {
            const customerResult = await (0, database_1.query)('SELECT * FROM customers WHERE user_id = $1', [user.id]);
            profile = customerResult.rows[0];
            const childrenResult = await (0, database_1.query)('SELECT * FROM children WHERE customer_id = $1', [profile?.id]);
            const petsResult = await (0, database_1.query)('SELECT * FROM pets WHERE customer_id = $1', [profile?.id]);
            profile = {
                ...profile,
                children: childrenResult.rows,
                pets: petsResult.rows
            };
        }
        else if (user.user_type === 'sitter') {
            const sitterResult = await (0, database_1.query)('SELECT * FROM sitters WHERE user_id = $1', [user.id]);
            profile = sitterResult.rows[0];
        }
        return res.json({
            user: {
                id: user.id,
                email: req.user?.email,
                userType: user.user_type,
                createdAt: user.created_at
            },
            profile
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({
            error: 'Failed to fetch profile',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;
        const { profileData } = req.body;
        if (!profileData) {
            return res.status(400).json({ error: 'Profile data is required' });
        }
        const userResult = await (0, database_1.query)('SELECT id, user_type FROM users WHERE firebase_uid = $1', [firebaseUid]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        if (user.user_type === 'customer') {
            const { fullName, dateOfBirth, area, city } = profileData;
            await (0, database_1.query)('UPDATE customers SET full_name = $1, date_of_birth = $2, area = $3, city = $4, updated_at = CURRENT_TIMESTAMP WHERE user_id = $5', [fullName, dateOfBirth, area, city, user.id]);
        }
        else if (user.user_type === 'sitter') {
            const { fullName, age, dateOfBirth, area, city, hoursPerWeek, sitterType, experience } = profileData;
            await (0, database_1.query)('UPDATE sitters SET full_name = $1, age = $2, date_of_birth = $3, area = $4, city = $5, hours_per_week = $6, sitter_type = $7, experience = $8, updated_at = CURRENT_TIMESTAMP WHERE user_id = $9', [fullName, age, dateOfBirth, area, city, hoursPerWeek, sitterType, experience, user.id]);
        }
        return res.json({ message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({
            error: 'Failed to update profile',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map