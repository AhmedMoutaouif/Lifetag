const COOKIE_NAME = process.env.JWT_COOKIE_NAME || "lifetag_access";

/** Options for httpOnly JWT cookie (7 jours, aligné sur expiresIn du login). */
function getAuthCookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    const sameSiteRaw = (process.env.COOKIE_SAME_SITE || (isProd ? "none" : "lax")).toLowerCase();
    const sameSite = sameSiteRaw === "strict" ? "strict" : sameSiteRaw === "none" ? "none" : "lax";
    const secure = process.env.COOKIE_SECURE === "false" ? false : sameSite === "none" || isProd;
    const opts = {
        httpOnly: true,
        path: "/",
        sameSite,
        secure,
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
    if (process.env.COOKIE_DOMAIN) {
        opts.domain = process.env.COOKIE_DOMAIN;
    }
    return opts;
}

function readTokenFromRequest(req) {
    const fromHeader = req.header("Authorization")?.split(" ")[1];
    if (fromHeader) return fromHeader;
    const c = req.cookies?.[COOKIE_NAME];
    if (typeof c === "string" && c.length > 0) return c;
    return null;
}

function attachAuthCookie(res, token) {
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
}

function clearAuthCookie(res) {
    const o = getAuthCookieOptions();
    res.clearCookie(COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        sameSite: o.sameSite,
        secure: o.secure,
        ...(o.domain ? { domain: o.domain } : {})
    });
}

module.exports = {
    COOKIE_NAME,
    readTokenFromRequest,
    attachAuthCookie,
    clearAuthCookie
};
