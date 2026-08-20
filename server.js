const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Allow backend to understand JSON data
app.use(express.json());

// Temporary report storage
let reports = [];

// Test route
app.get("/", (req, res) => {
    res.send("🚀 CampusFix Backend is Working!");
});


// Receive a new report
app.post("/api/reports", (req, res) => {

    const report = req.body;

    // Give the report an ID
    report.id = reports.length + 1;

    // New reports start as Open
    report.status = "Open";


    // Find how many similar reports already exist
    const similarReports = reports.filter(existingReport =>

        existingReport.building === report.building &&
        existingReport.floor === report.floor &&
        existingReport.room === report.room &&
        existingReport.issue === report.issue

    );


    // Include the new report in the count
    const reportCount = similarReports.length + 1;


    // Automatic Priority
    if (reportCount >= 5) {

        report.priority = "High";

    } else if (reportCount >= 3) {

        report.priority = "Medium";

    } else {

        report.priority = "Low";

    }


    // Save report
    reports.push(report);


    res.json({

        success: true,

        message: "Report submitted successfully!",

        report: report

    });

});

// Get all reports
app.get("/api/reports", (req, res) => {

    res.json({
        totalReports: reports.length,
        reports: reports
    });

});
// ========================================
// RESOLVE ISSUE - DEMO OTP SYSTEM
// ========================================

app.post("/api/reports/:id/resolve", (req, res) => {

    const reportId = Number(req.params.id);

    const report = reports.find(
        report => report.id === reportId
    );

    if (!report) {

        return res.status(404).json({
            success: false,
            message: "Report not found."
        });

    }
    


    // Generate a random 6-digit OTP

    const otp = Math.floor(
        100000 + Math.random() * 900000
    ).toString();


    // Save OTP temporarily with the report

    report.resolveOtp = otp;

    report.otpVerified = false;


    res.json({

        success: true,

        message: "Demo OTP generated.",

        demoOtp: otp,

        reportId: report.id

    });

});
// ========================================
// VERIFY OTP AND CLOSE ISSUE
// ========================================

app.post("/api/reports/:id/verify-otp", (req, res) => {

    const reportId = Number(req.params.id);

    const enteredOtp = String(req.body.otp);

    const report = reports.find(
        report => report.id === reportId
    );

    if (!report) {

        return res.status(404).json({
            success: false,
            message: "Report not found."
        });

    }

    // Check OTP
    if (
        !report.resolveOtp ||
        enteredOtp !== report.resolveOtp
    ) {

        return res.json({
            success: false,
            message: "Incorrect OTP."
        });

    }

    // OTP correct → close the issue
    report.status = "Resolved";

    // OTP can no longer be reused
    delete report.resolveOtp;

    report.otpVerified = true;

    report.resolvedAt = new Date().toISOString();

    res.json({

        success: true,

        message: "Issue successfully resolved.",

        report: report

    });

});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusFix backend running on port ${PORT}`);
});


// ================================
// CAMPUSFIX BACKEND CONNECTION
// ================================

async function testBackend() {

    try {

        const response = await fetch("http://localhost:3000/");

        const message = await response.text();

        console.log("Backend says:", message);

    } catch (error) {

        console.log("Backend connection failed:", error);

    }

}

testBackend();