import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
    // windowMs: 15 * 60 * 1000, // 15 = 15 minutes, 1 = 1 minute
    // windowMs: 1 * 60 * 1000, // 15 = 15 minutes, 1 = 1 minute
    windowMs: 1 * 5 * 1000, // 15 = 15 minutes, 1 = 1 minute => 60 => 5 = 5 seconds
    limit: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

const specificLimiter = rateLimit({
    // windowMs: 15 * 60 * 1000, // 15 = 15 minutes, 1 = 1 minute
    // windowMs: 1 * 60 * 1000, // 15 = 15 minutes, 1 = 1 minute
    windowMs: 1 * 10 * 1000, // 15 = 15 minutes, 1 = 1 minute => 60 => 5 = 5 seconds
    limit: 4, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

export {
    limiter,
    specificLimiter
};