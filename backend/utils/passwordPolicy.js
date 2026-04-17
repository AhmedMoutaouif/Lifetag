const PASSWORD_MIN_LENGTH = 8;

function assertPasswordMeetsPolicy(password) {
    if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
        const err = new Error(`Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`);
        err.statusCode = 400;
        throw err;
    }
}

module.exports = { PASSWORD_MIN_LENGTH, assertPasswordMeetsPolicy };
