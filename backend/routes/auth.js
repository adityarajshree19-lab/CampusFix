const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    findUserByEmail,
    createUser,
    publicUser
} = require("../db");
const { getJwtSecret } = require("../jwt-secret");
const {
    getUserFromRequest
} = require("../middleware/auth");

const router = express.Router();

const COOKIE_NAME = "campusfix_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function setAuthCookie(res, user) {
    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role
        },
        getJwtSecret(),
        {
            expiresIn: "7d"
        }
    );

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: COOKIE_MAX_AGE,
        path: "/"
    });
}

router.post("/signup", function (req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        if (findUserByEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        const user = createUser(
            email,
            passwordHash,
            "student"
        );

        setAuthCookie(res, user);

        res.json({
            success: true,
            user: publicUser(user)
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not create account."
        });
    }
});

router.post("/login", function (req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || "");

        const user = findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Incorrect email or password."
            });
        }

        const matches = bcrypt.compareSync(
            password,
            user.password_hash
        );

        if (!matches) {
            return res.status(401).json({
                success: false,
                message: "Incorrect email or password."
            });
        }

        setAuthCookie(res, user);

        res.json({
            success: true,
            user: publicUser(user)
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not log in."
        });
    }
});

router.post("/logout", function (req, res) {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
    });

    res.json({
        success: true
    });
});

router.get("/me", function (req, res) {
    const user = getUserFromRequest(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });
    }

    res.json({
        success: true,
        user: user
    });
});

module.exports = router;
