const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "campusfix.db");

const db = new DatabaseSync(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY,
        reporter_id INTEGER NOT NULL,
        building TEXT NOT NULL,
        floor TEXT NOT NULL,
        room TEXT NOT NULL,
        issue TEXT NOT NULL,
        description TEXT DEFAULT '',
        priority TEXT DEFAULT 'Low',
        status TEXT DEFAULT 'Pending',
        media TEXT,
        mediaType TEXT,
        createdAt TEXT NOT NULL,
        otp TEXT,
        resolvedAt TEXT,
        studentContact TEXT,
        assignedStaff TEXT,
        statusHistory TEXT,
        FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        contactNumber TEXT NOT NULL,
        isActive INTEGER DEFAULT 1
    );
`);

// Seed Staff Data
const staffCountRow = db.prepare("SELECT COUNT(*) AS total FROM staff").get();
if (staffCountRow && staffCountRow.total === 0) {
    const seedStaff = [
        ["Ramesh", "Plumber", "9876543210"],
        ["Suresh", "Electrician", "9876543211"],
        ["Vikram", "Carpenter", "9876543212"],
        ["Anil", "Electrician", "9876543213"],
        ["Manoj", "Plumber", "9876543214"],
        ["Rajesh", "General Maintenance", "9876543215"],
        ["Sanjay", "AC Technician", "9876543216"],
        ["Deepak", "Carpenter", "9876543217"],
        ["Ashok", "Electrician", "9876543218"],
        ["Naresh", "Plumber", "9876543219"]
    ];
    
    const insertStaffStmt = db.prepare(`INSERT INTO staff (name, role, contactNumber, isActive) VALUES (?, ?, ?, 1)`);
    seedStaff.forEach(s => insertStaffStmt.run(s[0], s[1], s[2]));
}

// Simple migration to add new columns if they don't exist
try { db.exec(`ALTER TABLE reports ADD COLUMN studentContact TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE reports ADD COLUMN assignedStaff TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE reports ADD COLUMN statusHistory TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE reports ADD COLUMN acceptedAt TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE reports ADD COLUMN maintenanceStaff TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE reports ADD COLUMN expectedArrival TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE reports ADD COLUMN expectedResolutionDate TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE reports ADD COLUMN adminNotes TEXT;`); } catch (e) { }


function rowToReport(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        reporterId: row.reporter_id,
        building: row.building,
        floor: row.floor,
        room: row.room,
        issue: row.issue,
        description: row.description || "",
        priority: row.priority,
        status: row.status,
        media: row.media,
        mediaType: row.mediaType,
        createdAt: row.createdAt,
        otp: row.otp,
        resolvedAt: row.resolvedAt,
        studentContact: row.studentContact || "",
        assignedStaff: row.assignedStaff ? JSON.parse(row.assignedStaff) : null,
        statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : [],
        acceptedAt: row.acceptedAt || null,
        maintenanceStaff: row.maintenanceStaff ? JSON.parse(row.maintenanceStaff) : null,
        expectedArrival: row.expectedArrival || null,
        expectedResolutionDate: row.expectedResolutionDate || null,
        adminNotes: row.adminNotes ? JSON.parse(row.adminNotes) : []
    };
}

function findUserByEmail(email) {
    return db.prepare(
        "SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?"
    ).get(email);
}

function findUserById(id) {
    return db.prepare(
        "SELECT id, email, role, created_at FROM users WHERE id = ?"
    ).get(id);
}

function createUser(email, passwordHash, role) {
    const result = db.prepare(
        `INSERT INTO users (email, password_hash, role, created_at)
         VALUES (?, ?, ?, ?)`
    ).run(
        email,
        passwordHash,
        role,
        new Date().toISOString()
    );

        return findUserById(Number(result.lastInsertRowid));
}

function getAllReports() {
    return db.prepare(
        "SELECT * FROM reports ORDER BY createdAt ASC"
    ).all().map(rowToReport);
}

function getReportsByUser(userId) {
    return db.prepare(
        "SELECT * FROM reports WHERE reporter_id = ? ORDER BY createdAt ASC"
    ).all(userId).map(rowToReport);
}

function getReportById(id) {
    return rowToReport(
        db.prepare(
            "SELECT * FROM reports WHERE id = ?"
        ).get(id)
    );
}

function countSimilarOpenReports(building, floor, room, issue) {
    const row = db.prepare(
        `SELECT COUNT(*) AS total
         FROM reports
         WHERE building = ?
           AND floor = ?
           AND room = ?
           AND issue = ?
           AND status = 'Pending'`
    ).get(building, floor, room, issue);

    return row ? Number(row.total) : 0;
}

function insertReport(report) {
    db.prepare(
        `INSERT INTO reports (
            id, reporter_id, building, floor, room, issue,
            description, priority, status, media, mediaType,
            createdAt, otp, resolvedAt, studentContact, assignedStaff, statusHistory,
            acceptedAt, maintenanceStaff, expectedArrival, expectedResolutionDate, adminNotes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        report.id,
        report.reporterId,
        report.building,
        report.floor,
        report.room,
        report.issue,
        report.description,
        report.priority,
        report.status,
        report.media,
        report.mediaType,
        report.createdAt,
        report.otp,
        report.resolvedAt || null,
        report.studentContact || "",
        report.assignedStaff ? JSON.stringify(report.assignedStaff) : null,
        report.statusHistory ? JSON.stringify(report.statusHistory) : JSON.stringify([]),
        report.acceptedAt || null,
        report.maintenanceStaff ? JSON.stringify(report.maintenanceStaff) : null,
        report.expectedArrival || null,
        report.expectedResolutionDate || null,
        report.adminNotes ? JSON.stringify(report.adminNotes) : JSON.stringify([])
    );

    return getReportById(report.id);
}

function saveReport(report) {
    db.prepare(
        `UPDATE reports
         SET priority = ?,
             status = ?,
             otp = ?,
             resolvedAt = ?,
             media = ?,
             mediaType = ?,
             description = ?,
             studentContact = ?,
             assignedStaff = ?,
             statusHistory = ?,
             acceptedAt = ?,
             maintenanceStaff = ?,
             expectedArrival = ?,
             expectedResolutionDate = ?,
             adminNotes = ?
         WHERE id = ?`
    ).run(
        report.priority,
        report.status,
        report.otp,
        report.resolvedAt || null,
        report.media,
        report.mediaType,
        report.description,
        report.studentContact || "",
        report.assignedStaff ? JSON.stringify(report.assignedStaff) : null,
        report.statusHistory ? JSON.stringify(report.statusHistory) : JSON.stringify([]),
        report.acceptedAt || null,
        report.maintenanceStaff ? JSON.stringify(report.maintenanceStaff) : null,
        report.expectedArrival || null,
        report.expectedResolutionDate || null,
        report.adminNotes ? JSON.stringify(report.adminNotes) : JSON.stringify([]),
        report.id
    );

    return getReportById(report.id);
}

function publicUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role
    };
}

function getAllStaff() {
    return db.prepare("SELECT * FROM staff WHERE isActive = 1").all();
}

function getStaffById(id) {
    return db.prepare("SELECT * FROM staff WHERE id = ?").get(id);
}

if (!fs.existsSync(dbPath)) {
    // DatabaseSync creates the file on open; this branch is a safety no-op.
}

module.exports = {
    db,
    findUserByEmail,
    findUserById,
    createUser,
    getAllReports,
    getReportsByUser,
    getReportById,
    countSimilarOpenReports,
    insertReport,
    saveReport,
    publicUser,
    getAllStaff,
    getStaffById
};
