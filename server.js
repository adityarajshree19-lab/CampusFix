const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());


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


// Make uploaded files publicly accessible

app.use(
    "/uploads",
    express.static(uploadDirectory)
);


// =====================================================
// TEMPORARY DATABASE
// =====================================================

let reports = [];


// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

    res.send(
        "🚀 CampusFix Backend is Working!"
    );

});


// =====================================================
// CREATE REPORT
// =====================================================

app.post(
    "/api/reports",
    upload.single("media"),

    (req, res) => {

        try {

            const {
                building,
                floor,
                room,
                issue,
                description,
                mediaType
            } = req.body;


            if (
                !building ||
                !floor ||
                !room ||
                !issue
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Required fields are missing."
                });

            }


            const id =
                Date.now();


            // Count similar active reports

            const similarReports =
                reports.filter(report =>

                    report.building === building &&
                    report.floor === floor &&
                    report.room === room &&
                    report.issue === issue &&
                    report.status === "Open"

                );


            const reportCount =
                similarReports.length + 1;


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


            const report = {

                id,

                building,

                floor,

                room,

                issue,

                description:
                    description || "",

                priority,

                status: "Open",

                media,

                mediaType:
                    mediaType || null,

                createdAt:
                    new Date().toISOString(),

                otp: null

            };


            reports.push(report);


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
// GET ALL REPORTS
// =====================================================

app.get(
    "/api/reports",
    (req, res) => {

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
    (req, res) => {

        const id =
            Number(req.params.id);


        const report =
            reports.find(
                r => r.id === id
            );


        if (!report) {

            return res.status(404).json({

                success: false,

                message:
                    "Report not found."

            });

        }


        res.json({

            success: true,

            report

        });

    }
);


// =====================================================
// START RESOLUTION
// =====================================================

app.post(
    "/api/reports/:id/resolve",
    (req, res) => {

        const id =
            Number(req.params.id);


        const report =
            reports.find(
                r => r.id === id
            );


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
    (req, res) => {

        const id =
            Number(req.params.id);

        const enteredOtp =
            String(
                req.body.otp || ""
            );


        const report =
            reports.find(
                r => r.id === id
            );


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


        res.json({

            success: true,

            message:
                "Issue resolved successfully.",

            report

        });

    }
);


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


// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            `🚀 CampusFix backend running on port ${PORT}`
        );

    }
);
