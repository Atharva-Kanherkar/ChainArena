"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') }); // Adjust path if needed
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/user/routes"));
const routes_3 = __importDefault(require("./modules/tournament/routes"));
const routes_4 = __importDefault(require("./modules/team/routes"));
const routes_5 = __importDefault(require("./modules/match/routes"));
const rateLimit_1 = require("./middlewares/rateLimit");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./utils/swagger");
require("dotenv/config");
// Load environment variables
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
const allowedOrigins = [
    'http://localhost:3000', // Your local frontend dev server
    'https://chainarena.vercel.app' // Your deployed frontend URL (replace this!)
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Ensure OPTIONS is included
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs));
// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
// Body parser
app.use(express_1.default.json());
// Routes
app.use('/auth', rateLimit_1.authLimiter, routes_1.default);
app.use('/users', rateLimit_1.standardLimiter, routes_2.default);
app.use('/tournaments', rateLimit_1.standardLimiter, routes_3.default);
app.use('/teams', rateLimit_1.standardLimiter, routes_4.default);
app.use('/matches', rateLimit_1.standardLimiter, routes_5.default);
// Catch-all error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Server error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
