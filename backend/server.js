const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const { loadEnvFile } = require("./jwt-secret");
const {
    getAllReports,
    getReportsByUser,
    getReportById,
    countSimilarOpenReports,
    insertReport,
    saveReport,
    getAllStaff,
    getStaffById
} = require("./db");
const {
    requireAuth,
    requireAdmin,
    requireAuthPage,
    requireAdminPage,
    getUserFromRequest
} = require("./middleware/auth");
const authRoutes = require("./routes/auth");

loadEnvFile();

const app = express();
const PORT = process.env.PORT || 5000;
const frontendDirectory = path.join(__dirname, "..");
const privateDirectory = path.join(__dirname, "private");


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


// =====================================================
// UPLOAD FOLDER
// =====================================================

const uploadDirectory =
    path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}


// =====================================================
// MULTER
// =====================================================

const storage =
    multer.diskStorage({

        destination: function (req, file, cb) {

            cb(
                null,
                uploadDirectory
            );

        },


        filename: function (req, file, cb) {

            const extension =
                path.extname(file.originalname);

            const filename =
                Date.now() +
                "-" +
                Math.round(
                    Math.random() * 100000
                ) +
                extension;

            cb(
                null,
                filename
            );

        }

    });


const upload =
    multer({
        storage: storage,

        limits: {
            fileSize:
                100 * 1024 * 1024
        }
    });


app.use(
    "/uploads",
    express.static(uploadDirectory)
);


app.use("/api/auth", authRoutes);

app.get("/api/me", function (req, res) {
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


function canViewReport(user, report) {
    if (!user || !report) {
        return false;
    }

    if (user.role === "admin") {
        return true;
    }

    return report.reporterId === user.id;
}


// =====================================================
// CAMPUS SUMMARY (no individual complaints)
// =====================================================

app.get(
    "/api/campus-summary",
    (req, res) => {

        const reports = getAllReports();

        const active = reports.filter(
            report => report.status === "Open"
        );

        const high = active.filter(
            report => report.priority === "High"
        );

        res.json({
            success: true,
            totalCount: reports.length,
            activeCount: active.length,
            highCount: high.length
        });

    }
);


// =====================================================
// CREATE REPORT
// =====================================================

app.post(
    "/api/reports",
    requireAuth,
    upload.single("media"),

    (req, res) => {

        try {

            const {
                building,
                floor,
                room,
                issue,
                description,
                mediaType,
                studentContact
            } = req.body;


            if (
                !building ||
                !floor ||
                !room ||
                !issue ||
                !studentContact
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Required fields are missing."
                });

            }

            const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
            if (!phoneRegex.test(studentContact)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid contact number format."
                });
            }


            const id =
                Date.now();


            const similarCount =
                countSimilarOpenReports(
                    building,
                    floor,
                    room,
                    issue
                );


            const reportCount =
                similarCount + 1;


            let priority = "Low";


            if (reportCount >= 5) {

                priority = "High";

            }

            else if (reportCount >= 3) {

                priority = "Medium";

            }


            let media = null;

            if (req.file) {

                media =
                    "/uploads/" +
                    req.file.filename;

            }


            const report = insertReport({

                id,

                reporterId: req.user.id,

                building,

                floor,

                room,

                issue,

                description:
                    description || "",

                priority,

                status: "Pending",

                media,

                mediaType:
                    mediaType || null,

                createdAt:
                    new Date().toISOString(),

                otp: null,

                studentContact: studentContact,

                assignedStaff: null,

                statusHistory: []

            });


            console.log(
                "New CampusFix Report:",
                report
            );


            res.json({

                success: true,

                message:
                    "Report submitted successfully.",

                report

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Could not create report."

            });

        }

    }
);


// =====================================================
// STUDENT: OWN REPORTS
// =====================================================

app.get(
    "/api/reports/mine",
    requireAuth,
    (req, res) => {

        const reports =
            getReportsByUser(req.user.id);

        res.json({

            success: true,

            totalReports:
                reports.length,

            reports

        });

    }
);


// =====================================================
// ADMIN: GET ALL REPORTS
// =====================================================

app.get(
    "/api/reports",
    requireAuth,
    requireAdmin,
    (req, res) => {

        const reports = getAllReports();

        res.json({

            totalReports:
                reports.length,

            reports

        });

    }
);


// =====================================================
// GET ONE REPORT
// =====================================================

app.get(
    "/api/reports/:id",
    requireAuth,
    (req, res) => {

        const id =
            Number(req.params.id);


        const report =
            getReportById(id);


        if (!report) {

            return res.status(404).json({

                success: false,

                message:
                    "Report not found."

            });

        }


        if (!canViewReport(req.user, report)) {

            return res.status(403).json({

                success: false,

                message:
                    "You cannot view this report."

            });

        }


        res.json({

            success: true,

            report

        });

    }
);


// =====================================================
// ADMIN: UPDATE PRIORITY / STATUS
// =====================================================

app.patch(
    "/api/reports/:id",
    requireAuth,
    requireAdmin,
    (req, res) => {

        const id =
            Number(req.params.id);

        const report =
            getReportById(id);

        if (!report) {

            return res.status(404).json({
                success: false,
                message: "Report not found."
            });

        }

        const allowedPriority = [
            "Low",
            "Medium",
            "High"
        ];

        const allowedStatus = [
            "Open",
            "Resolved"
        ];

        if (req.body.priority) {

            if (
                allowedPriority.indexOf(
                    req.body.priority
                ) === -1
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid priority."
                });

            }

            report.priority = req.body.priority;

        }

        if (req.body.status) {

            if (
                allowedStatus.indexOf(
                    req.body.status
                ) === -1
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid status."
                });

            }

            report.status = req.body.status;

            if (report.status === "Resolved") {
                report.otp = null;
                report.resolvedAt =
                    new Date().toISOString();
            }

        }

        const saved = saveReport(report);

        res.json({
            success: true,
            report: saved
        });

    }
);


// =====================================================
// PHASE 2: ADMIN STATUS UPDATE
// =====================================================

app.patch(
    "/api/complaints/:id/status",
    requireAuth,
    requireAdmin,
    (req, res) => {
        const id = Number(req.params.id);
        const report = getReportById(id);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        const { status, note, assignedStaff } = req.body;
        const allowedStatus = ["Pending", "Seen by Admin", "In Progress", "Resolved"];

        if (status && allowedStatus.includes(status)) {
            report.status = status;
            
            if (status === "Resolved") {
                report.otp = null;
                report.resolvedAt = new Date().toISOString();
            }
        }

        if (assignedStaff !== undefined) {
            report.assignedStaff = assignedStaff;
        }

        if (status || note) {
            report.statusHistory = report.statusHistory || [];
            report.statusHistory.push({
                status: report.status,
                note: note || '',
                updatedAt: new Date().toISOString()
            });
            
            // Phase 5: Mock SMS Notification
            if (report.studentContact) {
                console.log(`\n📲 [SMS NOTIFICATION TO ${report.studentContact}]`);
                console.log(`Complaint #${report.id} updated! Status: ${report.status}`);
                if (note) console.log(`Note: ${note}`);
                console.log(`Track it here: http://localhost:5000/track.html?id=${report.id}\n`);
            }
        }

        const saved = saveReport(report);
        res.json({ success: true, report: saved });
    }
);

// =====================================================
// PHASE 2: STUDENT TRACK COMPLAINT
// =====================================================

app.get(
    "/api/complaints/:id/track",
    (req, res) => {
        const id = Number(req.params.id);
        const report = getReportById(id);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        res.json({
            success: true,
            status: report.status,
            assignedStaff: report.maintenanceStaff || report.assignedStaff,
            statusHistory: report.adminNotes || report.statusHistory || []
        });
    }
);


// =====================================================
// START RESOLUTION
// =====================================================

app.post(
    "/api/reports/:id/resolve",
    requireAuth,
    requireAdmin,
    (req, res) => {

        const id =
            Number(req.params.id);


        const report =
            getReportById(id);


        if (!report) {

            return res.status(404).json({

                success: false,

                message:
                    "Report not found."

            });

        }


        if (
            report.status === "Resolved"
        ) {

            return res.json({

                success: false,

                message:
                    "Report already resolved."

            });

        }


        const otp =
            String(
                Math.floor(
                    100000 +
                    Math.random() * 900000
                )
            );


        report.otp = otp;

        saveReport(report);


        console.log(
            `Demo OTP for report ${id}: ${otp}`
        );


        res.json({

            success: true,

            demoOtp: otp

        });

    }
);


// =====================================================
// VERIFY OTP
// =====================================================

app.post(
    "/api/reports/:id/verify-otp",
    requireAuth,
    requireAdmin,
    (req, res) => {

        const id =
            Number(req.params.id);

        const enteredOtp =
            String(
                req.body.otp || ""
            );


        const report =
            getReportById(id);


        if (!report) {

            return res.status(404).json({

                success: false,

                message:
                    "Report not found."

            });

        }


        if (
            report.otp !== enteredOtp
        ) {

            return res.json({

                success: false,

                message:
                    "Incorrect OTP."

            });

        }


        report.status =
            "Resolved";

        report.otp =
            null;

        report.resolvedAt =
            new Date().toISOString();

        const saved = saveReport(report);


        res.json({

            success: true,

            message:
                "Issue resolved successfully.",

            report: saved

        });

    }
);


// =====================================================
// PHASE 2: ADMIN ENDPOINTS
// =====================================================

// GET /api/admin/staff
app.get(
    "/api/admin/staff",
    requireAuth,
    requireAdmin,
    (req, res) => {
        const staff = getAllStaff();
        res.json({ success: true, staff });
    }
);

// 1. GET /api/admin/complaints
app.get(
    "/api/admin/complaints",
    requireAuth,
    requireAdmin,
    (req, res) => {
        const { status } = req.query;
        let reports = getAllReports();
        
        if (status) {
            reports = reports.filter(r => r.status === status);
        }
        
        res.json({
            success: true,
            reports: reports
        });
    }
);

// 2. PATCH /api/admin/complaints/:id/accept
app.patch(
    "/api/admin/complaints/:id/accept",
    requireAuth,
    requireAdmin,
    (req, res) => {
        const id = Number(req.params.id);
        const report = getReportById(id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: "Complaint not found." });
        }
        
        const { staffId, expectedArrival, expectedResolutionDate } = req.body;
        
        if (!staffId) {
            return res.status(400).json({ success: false, message: "Missing required staff selection." });
        }
        
        const staff = getStaffById(Number(staffId));
        if (!staff || staff.isActive !== 1) {
            return res.status(400).json({ success: false, message: "Invalid or inactive staff member." });
        }
        
        if (!expectedArrival) {
            return res.status(400).json({ success: false, message: "Missing expected arrival time." });
        }
        
        report.status = "Accepted";
        report.acceptedAt = new Date().toISOString();
        report.maintenanceStaff = {
            id: staff.id,
            name: staff.name,
            role: staff.role,
            contactNumber: staff.contactNumber
        };
        report.expectedArrival = expectedArrival;
        
        if (expectedResolutionDate) {
            report.expectedResolutionDate = expectedResolutionDate;
        }
        
        report.adminNotes = report.adminNotes || [];
        report.adminNotes.push({
            status: "Accepted",
            note: `Complaint accepted, ${staff.role} assigned`,
            updatedAt: new Date().toISOString()
        });
        
        const saved = saveReport(report);
        res.json({ success: true, message: "Complaint accepted successfully.", report: saved });
    }
);

// 3. PATCH /api/admin/complaints/:id/update
app.patch(
    "/api/admin/complaints/:id/update",
    requireAuth,
    requireAdmin,
    (req, res) => {
        const id = Number(req.params.id);
        const report = getReportById(id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: "Complaint not found." });
        }
        
        const { status, staffId, expectedArrival, expectedResolutionDate, note } = req.body;
        
        if (status && ["In Progress", "Resolved"].includes(status)) {
            report.status = status;
        }
        
        if (staffId) {
            const staff = getStaffById(Number(staffId));
            if (!staff || staff.isActive !== 1) {
                return res.status(400).json({ success: false, message: "Invalid or inactive staff member." });
            }
            report.maintenanceStaff = {
                id: staff.id,
                name: staff.name,
                role: staff.role,
                contactNumber: staff.contactNumber
            };
        }
        
        if (expectedArrival) report.expectedArrival = expectedArrival;
        if (expectedResolutionDate) report.expectedResolutionDate = expectedResolutionDate;
        
        if (report.status === "Resolved") {
            report.resolvedAt = new Date().toISOString();
            report.otp = null;
        }
        
        report.adminNotes = report.adminNotes || [];
        report.adminNotes.push({
            status: report.status,
            note: note || `Status updated to ${report.status}`,
            updatedAt: new Date().toISOString()
        });
        
        const saved = saveReport(report);
        res.json({ success: true, message: "Complaint updated successfully.", report: saved });
    }
);

// =====================================================
// PROTECTED DASHBOARD PAGE
// =====================================================

app.get(
    "/dashboard",
    requireAuthPage,
    requireAdminPage,
    (req, res) => {

        res.sendFile(
            path.join(
                privateDirectory,
                "dashboard.html"
            )
        );

    }
);


app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            frontendDirectory,
            "index.html"
        )
    );

});


function serveRootFile(fileName) {

    return function (req, res) {

        res.sendFile(
            path.join(
                frontendDirectory,
                fileName
            )
        );

    };

}


app.get("/style.css", serveRootFile("style.css"));
app.get("/script.js", serveRootFile("script.js"));
app.get("/login.html", serveRootFile("login.html"));
app.get("/track.html", serveRootFile("track.html"));
app.get("/unauthorized.html", serveRootFile("unauthorized.html"));
app.get("/index.html", serveRootFile("index.html"));


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (error, req, res, next) => {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Server error."

        });

    }
);


app.listen(
    PORT,
    () => {

        console.log(
            `🚀 CampusFix backend running on port ${PORT}`
        );

    }
);
