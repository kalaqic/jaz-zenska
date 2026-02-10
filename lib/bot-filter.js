// Bot filtering utilities
// Shared bot detection logic for all API endpoints

// Simple in-memory rate limiting (for Vercel serverless functions)
// In production, consider using Redis or a database for distributed rate limiting
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.firstRequest > 3600000) { // 1 hour
            rateLimitStore.delete(key);
        }
    }
}, 300000); // 5 minutes

/**
 * Check if request is from a bot
 * @param {Object} req - Request object
 * @param {Object} body - Request body
 * @returns {Object} { isBot: boolean, reason: string }
 */
function detectBot(req, body) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               'unknown';
    
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';
    
    // 1. Honeypot check
    if (body.are_you_a_bot && String(body.are_you_a_bot).trim() !== '') {
        return { isBot: true, reason: 'honeypot_field_filled' };
    }
    
    // Additional honeypot fields
    if (body.website && String(body.website).trim() !== '') {
        return { isBot: true, reason: 'honeypot_website_field_filled' };
    }
    
    if (body.company && String(body.company).trim() !== '') {
        return { isBot: true, reason: 'honeypot_company_field_filled' };
    }
    
    // 2. Rate limiting - max 5 requests per IP per hour
    const rateLimitKey = `rate_limit_${ip}`;
    const now = Date.now();
    const rateLimitData = rateLimitStore.get(rateLimitKey);
    
    if (rateLimitData) {
        const timeSinceFirst = now - rateLimitData.firstRequest;
        if (timeSinceFirst < 3600000) { // Within 1 hour
            if (rateLimitData.count >= 5) {
                return { isBot: true, reason: 'rate_limit_exceeded' };
            }
            rateLimitData.count++;
        } else {
            // Reset after 1 hour
            rateLimitStore.set(rateLimitKey, { count: 1, firstRequest: now });
        }
    } else {
        rateLimitStore.set(rateLimitKey, { count: 1, firstRequest: now });
    }
    
    // 3. Form submission speed check (if timestamp provided)
    if (body.form_start_time) {
        const formStartTime = parseInt(body.form_start_time);
        const submissionTime = now;
        const timeSpent = submissionTime - formStartTime;
        
        // If form was filled in less than 2 seconds, it's likely a bot
        if (timeSpent < 2000) {
            return { isBot: true, reason: 'form_filled_too_fast' };
        }
        
        // If form was filled in more than 1 hour, might be suspicious
        if (timeSpent > 3600000) {
            return { isBot: true, reason: 'form_took_too_long' };
        }
    }
    
    // 4. Email validation - check for common bot patterns
    if (body.email) {
        const email = String(body.email).toLowerCase();
        
        // Common bot email patterns
        const botEmailPatterns = [
            /^test\d+@/i,
            /^admin@/i,
            /^noreply@/i,
            /^no-reply@/i,
            /@example\./i,
            /@test\./i,
            /@fake\./i,
            /@spam\./i,
            /@bot\./i,
            /^[a-z]+\d+@[a-z]+\d+\./i, // pattern like abc123@xyz456.com
            /^[a-z]{1,3}\d{4,}@/i, // very short name with many digits
        ];
        
        for (const pattern of botEmailPatterns) {
            if (pattern.test(email)) {
                return { isBot: true, reason: 'suspicious_email_pattern' };
            }
        }
        
        // Check for valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isBot: true, reason: 'invalid_email_format' };
        }
        
        // Check for disposable email domains (common bot tactic)
        const disposableDomains = [
            'tempmail.com', 'guerrillamail.com', 'mailinator.com',
            '10minutemail.com', 'throwaway.email', 'temp-mail.org'
        ];
        const emailDomain = email.split('@')[1];
        if (disposableDomains.includes(emailDomain)) {
            return { isBot: true, reason: 'disposable_email_domain' };
        }
    }
    
    // 5. User-Agent validation
    if (!userAgent || userAgent.length < 10) {
        return { isBot: true, reason: 'missing_or_invalid_user_agent' };
    }
    
    // Common bot user agents
    const botUserAgents = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
        'python', 'java', 'go-http', 'scrapy', 'headless'
    ];
    
    const lowerUA = userAgent.toLowerCase();
    for (const botUA of botUserAgents) {
        if (lowerUA.includes(botUA)) {
            return { isBot: true, reason: 'bot_user_agent' };
        }
    }
    
    // 6. Referrer check - should come from your domain
    if (referer && !referer.includes('jazzenska.com') && !referer.includes('localhost')) {
        // Allow if no referer (direct access) but suspicious if external referer
        if (referer.length > 0 && !referer.includes('google') && !referer.includes('facebook')) {
            // Log but don't block - might be legitimate
            console.log('Suspicious referer:', referer);
        }
    }
    
    // 7. Check for missing required fields filled suspiciously fast
    // This is handled by individual endpoints
    
    return { isBot: false, reason: null };
}

/**
 * Get client IP address
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           'unknown';
}

module.exports = {
    detectBot,
    getClientIP
};
