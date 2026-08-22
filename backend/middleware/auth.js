const jwt = require("jsonwebtoken");
const { findUserById, publicUser } = require("../db");
const { getJwtSecret } = require("../jwt-secret");

function getUserFromRequest(req) {
    const token =
        req.cookies &&
        req.cookies.campusfix_token;

    if (!token) {
        return null;
    }

    try {
        const payload = jwt.verify(
            token,
            getJwtSecret()
        );

        const user = findUserById(payload.userId);

        if (!user) {
            return null;
        }

        return publicUser(user);
    } catch (error) {
        return null;
    }
}

function requireAuth(req, res, next) {
    const user = getUserFromRequest(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please log in."
        });
    }

    req.user = user;
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required."
        });
    }

    next();
}

function requireAuthPage(req, res, next) {
    const user = getUserFromRequest(req);

    if (!user) {
        return res.redirect(
            "/login.html?next=" +
            encodeURIComponent(req.originalUrl || "/dashboard")
        );
    }

    req.user = user;
    next();
}

function requireAdminPage(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.redirect("/unauthorized.html");
    }

    next();
}

module.exports = {
    getUserFromRequest,
    requireAuth,
    requireAdmin,
    requireAuthPage,
    requireAdminPage
};
