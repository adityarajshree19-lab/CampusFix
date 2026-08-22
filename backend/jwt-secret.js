const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const secretFile = path.join(__dirname, ".jwt-secret");

function loadEnvFile() {
    const envPath = path.join(__dirname, "..", ".env");

    if (!fs.existsSync(envPath)) {
        return;
    }

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

    lines.forEach(function (line) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.charAt(0) === "#") {
            return;
        }

        const equals = trimmed.indexOf("=");

        if (equals === -1) {
            return;
        }

        const key = trimmed.slice(0, equals).trim();
        let value = trimmed.slice(equals + 1).trim();

        if (
            (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
            (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")
        ) {
            value = value.slice(1, -1);
        }

        if (!process.env[key]) {
            process.env[key] = value;
        }
    });
}

loadEnvFile();

function getJwtSecret() {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }

    if (fs.existsSync(secretFile)) {
        return fs.readFileSync(secretFile, "utf8").trim();
    }

    const generated = crypto.randomBytes(48).toString("hex");

    fs.writeFileSync(secretFile, generated, "utf8");

    return generated;
}

module.exports = {
    loadEnvFile,
    getJwtSecret
};
