const jwt = require("jsonwebtoken");

function createJwt(data, duration) {
    const options = {
        issuer: 'discord-qotd-form-backend'
    };

    if (duration) {
        options.expiresIn = duration;
    }

    return jwt.sign(data, process.env.JWT_SECRET, options);
}

function decodeJwt(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch(e) { return null }
}

module.exports = { createJwt, decodeJwt };