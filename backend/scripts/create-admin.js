const bcrypt = require("bcryptjs");
const { loadEnvFile } = require("../jwt-secret");
const {
    findUserByEmail,
    createUser
} = require("../db");

loadEnvFile();

const email = String(
    process.env.ADMIN_EMAIL || ""
).trim().toLowerCase();

const password = String(
    process.env.ADMIN_PASSWORD || ""
);

if (!email || !password) {
    console.error(
        "Set ADMIN_EMAIL and ADMIN_PASSWORD in a .env file or as environment variables, then run:\n" +
        "  node backend/scripts/create-admin.js"
    );
    process.exit(1);
}

if (password.length < 8) {
    console.error(
        "ADMIN_PASSWORD must be at least 8 characters."
    );
    process.exit(1);
}

if (findUserByEmail(email)) {
    console.error(
        "An account with that email already exists. No admin was created."
    );
    process.exit(1);
}

const user = createUser(
    email,
    bcrypt.hashSync(password, 10),
    "admin"
);

console.log(
    "Admin account created for " + user.email + " (id " + user.id + ")."
);
console.log(
    "You can now log in at /login.html"
);
