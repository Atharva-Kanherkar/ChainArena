"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
exports.validateLogin = validateLogin;
const validateRegister = (req, res, next) => {
    const { email, supabase_uid } = req.body;
    if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
    }
    if (!supabase_uid) {
        res.status(400).json({ error: 'Supabase ID is required' });
        return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
    }
    next();
};
exports.validateRegister = validateRegister;
function validateLogin(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
    }
    next();
}
