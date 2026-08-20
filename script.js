// =====================================================
// CAMPUSFIX FINAL JAVASCRIPT
// =====================================================

const API =
    "https://campusfix-xzjb.onrender.com";

let selectedMedia = null;
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingType = null;


// =====================================================
// REPORT MODAL
// =====================================================

function reportProblem() {
    document.getElementById("reportModal").style.display = "flex";
}

function closeReportModal() {
    document.getElementById("reportModal").style.display = "none";
}


// =====================================================
// DASHBOARD
// =====================================================

async function showDashboard() {

    const dashboard =
        document.getElementById("dashboardSection");

    dashboard.style.display = "block";

    dashboard.scrollIntoView({
        behavior: "smooth"
    });

    await loadAdminDashboard();
}


// =====================================================
// FLOORS
// =====================================================

function updateFloors() {

    const building =
        document.getElementById("buildingSelect").value;

    const floorSelect =
        document.getElementById("floorSelect");

    const roomSelect =
        document.getElementById("roomSelect");

    floorSelect.innerHTML = "";
    roomSelect.innerHTML =
        '<option value="">Select Floor First</option>';

    roomSelect.disabled = true;

    if (!building) {

        floorSelect.disabled = true;

        floorSelect.innerHTML =
            '<option value="">Select Building First</option>';

        return;
    }

    floorSelect.disabled = false;

    floorSelect.innerHTML =
        '<option value="">Select Floor</option>';

    let floors = [];

    if (
        building === "Library" ||
        building === "Gym"
    ) {

        floors = ["Ground Floor"];

    } else {

        floors = [
            "Ground Floor",
            "First Floor",
            "Second Floor",
            "Third Floor"
        ];

    }

    floors.forEach(floor => {

        const option =
            document.createElement("option");

        option.value = floor;
        option.textContent = floor;

        floorSelect.appendChild(option);

    });
}


// =====================================================
// ROOMS
// =====================================================

function updateRooms() {

    const building =
        document.getElementById("buildingSelect").value;

    const floor =
        document.getElementById("floorSelect").value;

    const roomSelect =
        document.getElementById("roomSelect");

    roomSelect.innerHTML =
        '<option value="">Select Room / Area</option>';

    if (!floor) {

        roomSelect.disabled = true;
        return;

    }

    roomSelect.disabled = false;

    if (building === "Library") {

        [
            "Main Library",
            "Reading Area",
            "Study Area"
        ].forEach(addRoom);

        return;
    }

    if (building === "Gym") {

        [
            "Main Gym",
            "Equipment Area",
            "Training Area"
        ].forEach(addRoom);

        return;
    }

    let prefix = "Room";

    if (building === "E2") {
        prefix = "NB";
    }

    if (building === "GLA") {
        prefix = "GA";
    }

    const rooms = getRooms(prefix, floor);

    rooms.forEach(addRoom);


    function addRoom(room) {

        const option =
            document.createElement("option");

        option.value = room;
        option.textContent = room;

        roomSelect.appendChild(option);
    }
}


function getRooms(prefix, floor) {

    const numbers = {
        "Ground Floor": "0",
        "First Floor": "1",
        "Second Floor": "2",
        "Third Floor": "3"
    };

    const floorNumber =
        numbers[floor] || "0";

    const rooms = [];

    for (let i = 1; i <= 10; i++) {

        rooms.push(
            prefix +
            floorNumber +
            String(i).padStart(2, "0")
        );

    }

    return rooms;
}


// =====================================================
// EVIDENCE OPTIONS
// =====================================================

function openEvidenceOptions() {

    document.getElementById(
        "evidenceChooser"
    ).style.display = "flex";
}


function closeEvidenceOptions() {

    document.getElementById(
        "evidenceChooser"
    ).style.display = "none";
}


function choosePhotoUpload() {

    closeEvidenceOptions();

    document.getElementById(
        "photoUpload"
    ).click();
}


function chooseVideoUpload() {

    closeEvidenceOptions();

    document.getElementById(
        "videoUpload"
    ).click();
}


// =====================================================
// FILE UPLOAD
// =====================================================

function handleFileSelect(event, type) {

    const file =
        event.target.files[0];

    if (!file) return;

    selectedMedia = {
        file: file,
        type: type
    };

    showMediaPreview(file, type);
}


function showMediaPreview(file, type) {

    const preview =
        document.getElementById("evidencePreview");

    const url =
        URL.createObjectURL(file);

    if (type === "photo") {

        preview.innerHTML = `

            <div class="preview-item">

                <img src="${url}">

                <button
                    class="remove-media"
                    onclick="removeMedia()">

                    Remove Photo

                </button>

            </div>

        `;

    } else {

        preview.innerHTML = `

            <div class="preview-item">

                <video
                    src="${url}"
                    controls>
                </video>

                <button
                    class="remove-media"
                    onclick="removeMedia()">

                    Remove Video

                </button>

            </div>

        `;
    }
}


function removeMedia() {

    selectedMedia = null;

    document.getElementById(
        "evidencePreview"
    ).innerHTML = "";

    document.getElementById(
        "photoUpload"
    ).value = "";

    document.getElementById(
        "videoUpload"
    ).value = "";
}


// =====================================================
// LIVE CAMERA
// =====================================================

async function openCamera(type) {

    closeEvidenceOptions();

    recordingType = type;

    const modal =
        document.getElementById("cameraModal");

    const video =
        document.getElementById("cameraVideo");

    const captureButton =
        document.getElementById("captureButton");

    const recordButton =
        document.getElementById("recordButton");

    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: true,

                audio: type === "video"

            });

        video.srcObject =
            cameraStream;

        modal.style.display = "flex";

        if (type === "photo") {

            captureButton.style.display = "block";
            recordButton.style.display = "none";

            document.getElementById(
                "cameraTitle"
            ).textContent = "📷 Capture Photo";

        } else {

            captureButton.style.display = "none";
            recordButton.style.display = "block";

            document.getElementById(
                "cameraTitle"
            ).textContent = "🎥 Record Video";

        }

    } catch (error) {

        console.error(error);

        alert(
            "Camera permission is required.\n\n" +
            "Please allow camera access and try again."
        );
    }
}


// =====================================================
// CAPTURE PHOTO
// =====================================================

function capturePhoto() {

    const video =
        document.getElementById("cameraVideo");

    const canvas =
        document.getElementById("cameraCanvas");

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;

    const context =
        canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.toBlob(blob => {

        const file =
            new File(
                [blob],
                "campusfix-photo.jpg",
                {
                    type: "image/jpeg"
                }
            );

        selectedMedia = {
            file: file,
            type: "photo"
        };

        showMediaPreview(file, "photo");

        closeCamera();

    }, "image/jpeg", 0.9);
}


// =====================================================
// VIDEO RECORDING
// =====================================================

function toggleVideoRecording() {

    const button =
        document.getElementById("recordButton");

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.stop();

        button.textContent =
            "● Start Recording";

        return;
    }

    recordedChunks = [];

    const mimeType =
        MediaRecorder.isTypeSupported(
            "video/webm"
        )
            ? "video/webm"
            : "video/mp4";

    mediaRecorder =
        new MediaRecorder(
            cameraStream,
            { mimeType }
        );

    mediaRecorder.ondataavailable =
        event => {

            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }

        };

    mediaRecorder.onstop =
        () => {

            const blob =
                new Blob(
                    recordedChunks,
                    { type: mimeType }
                );

            const file =
                new File(
                    [blob],
                    "campusfix-video.webm",
                    {
                        type: mimeType
                    }
                );

            selectedMedia = {
                file: file,
                type: "video"
            };

            showMediaPreview(file, "video");

            closeCamera();
        };

    mediaRecorder.start();

    button.textContent =
        "■ Stop Recording";
}


// =====================================================
// CLOSE CAMERA
// =====================================================

function closeCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => track.stop());

        cameraStream = null;
    }

    document.getElementById(
        "cameraVideo"
    ).srcObject = null;

    document.getElementById(
        "cameraModal"
    ).style.display = "none";

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.stop();

    }

}


// =====================================================
// SUBMIT REPORT
// =====================================================

async function submitReport() {

    const building =
        document.getElementById(
            "buildingSelect"
        ).value;

    const floor =
        document.getElementById(
            "floorSelect"
        ).value;

    const room =
        document.getElementById(
            "roomSelect"
        ).value;

    const issue =
        document.getElementById(
            "issueSelect"
        ).value;

    const description =
        document.getElementById(
            "description"
        ).value.trim();


    if (
        !building ||
        !floor ||
        !room ||
        !issue
    ) {

        alert(
            "⚠️ Please complete all required fields."
        );

        return;
    }


    const formData =
        new FormData();

    formData.append(
        "building",
        building
    );

    formData.append(
        "floor",
        floor
    );

    formData.append(
        "room",
        room
    );

    formData.append(
        "issue",
        issue
    );

    formData.append(
        "description",
        description
    );


    if (selectedMedia) {

        formData.append(
            "media",
            selectedMedia.file
        );

        formData.append(
            "mediaType",
            selectedMedia.type
        );
    }


    try {

        const response =
            await fetch(
                `${API}/api/reports`,
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Report submission failed."
            );

        }


        const data =
            await response.json();


        if (data.success) {

            alert(
                "✅ Report Submitted Successfully!"
            );

            closeReportModal();

            resetReportForm();

        } else {

            alert(
                "❌ Report could not be submitted."
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "❌ Could not connect to CampusFix backend."
        );
    }
}


// =====================================================
// RESET REPORT
// =====================================================

function resetReportForm() {

    document.getElementById(
        "buildingSelect"
    ).value = "";

    document.getElementById(
        "floorSelect"
    ).innerHTML =
        '<option value="">Select Building First</option>';

    document.getElementById(
        "floorSelect"
    ).disabled = true;

    document.getElementById(
        "roomSelect"
    ).innerHTML =
        '<option value="">Select Floor First</option>';

    document.getElementById(
        "roomSelect"
    ).disabled = true;

    document.getElementById(
        "issueSelect"
    ).value = "";

    document.getElementById(
        "description"
    ).value = "";

    removeMedia();
}


// =====================================================
// DASHBOARD
// =====================================================

async function loadAdminDashboard() {

    try {

        const response =
            await fetch(
                `${API}/api/reports`
            );

        if (!response.ok) {
            throw new Error();
        }

        const data =
            await response.json();

        const reports =
            data.reports || [];


        const active =
            reports.filter(
                r => r.status === "Open"
            );

        const resolved =
            reports.filter(
                r => r.status === "Resolved"
            );

        const high =
            active.filter(
                r => r.priority === "High"
            );


        document.getElementById(
            "totalReports"
        ).textContent =
            reports.length;

        document.getElementById(
            "activeReports"
        ).textContent =
            active.length;

        document.getElementById(
            "resolvedReports"
        ).textContent =
            resolved.length;

        document.getElementById(
            "highPriorityReports"
        ).textContent =
            high.length;


        updateHealth(
            active.length,
            high.length
        );

        renderActiveIssues(active);

        renderRecurringIssues(reports);

        renderCases(reports);

        renderMostReportedZone(reports);

    } catch (error) {

        console.error(error);

        alert(
            "❌ Could not load dashboard."
        );
    }
}


// =====================================================
// HEALTH
// =====================================================

function updateHealth(active, high) {

    let score =
        100 -
        active * 2 -
        high * 5;

    score =
        Math.max(0, score);

    document.getElementById(
        "campusHealthScore"
    ).textContent = score;

    document.getElementById(
        "homeHealthScore"
    ).textContent =
        score + "%";

    document.getElementById(
        "homeHealthProgress"
    ).style.width =
        score + "%";


    let status =
        "🟢 Good";

    if (score < 80 && score >= 50) {
        status = "🟡 Needs Attention";
    }

    if (score < 50) {
        status = "🔴 Critical";
    }


    document.getElementById(
        "dashboardHealthStatus"
    ).textContent = status;

    document.getElementById(
        "homeHealthStatus"
    ).textContent = status;
}


// =====================================================
// ACTIVE ISSUES
// =====================================================

function renderActiveIssues(active) {

    const container =
        document.getElementById(
            "activeIssueList"
        );

    container.innerHTML = "";


    if (!active.length) {

        container.innerHTML = `
            <div class="issue-item">
                <div>
                    <strong>🟢 No Active Issues</strong>
                    <p>All current cases are resolved.</p>
                </div>
            </div>
        `;

        return;
    }


    active.slice(0, 8).forEach(report => {

        const icon =
            report.priority === "High"
                ? "🔴"
                : report.priority === "Medium"
                    ? "🟡"
                    : "🟢";


        const item =
            document.createElement("div");

        item.className =
            "issue-item";


        item.innerHTML = `

            <div>

                <strong>
                    ${icon} ${escapeHTML(report.issue)}
                </strong>

                <p>
                    ${escapeHTML(report.building)}
                    • ${escapeHTML(report.floor)}
                    • ${escapeHTML(report.room)}
                </p>

            </div>

            <div class="case-actions">

                <button
                    class="full-case-button"
                    onclick="viewFullCase(${report.id})">

                    Full Case

                </button>

                <button
                    class="resolve-button"
                    onclick="startResolve(${report.id})">

                    Resolve

                </button>

            </div>
        `;

        container.appendChild(item);
    });
}


// =====================================================
// RECURRING ISSUES
// =====================================================

function renderRecurringIssues(reports) {

    const container =
        document.getElementById(
            "recurringIssueList"
        );

    container.innerHTML = "";


    const counts = {};

    reports.forEach(report => {

        counts[report.issue] =
            (counts[report.issue] || 0) + 1;

    });


    const sorted =
        Object.entries(counts)
            .sort((a,b) => b[1] - a[1]);


    if (!sorted.length) {

        container.innerHTML =
            "<p>No patterns yet.</p>";

        return;
    }


    sorted.slice(0,6).forEach(
        ([issue,count]) => {

            const item =
                document.createElement("div");

            item.className =
                "pattern-item";

            item.innerHTML = `

                <span>
                    📊 ${escapeHTML(issue)}
                </span>

                <strong>
                    ${count} reports
                </strong>

            `;

            container.appendChild(item);
        }
    );
}


// =====================================================
// MOST REPORTED ZONE
// =====================================================

function renderMostReportedZone(reports) {

    const counts = {};

    reports.forEach(report => {

        counts[report.building] =
            (counts[report.building] || 0) + 1;

    });


    const sorted =
        Object.entries(counts)
            .sort((a,b) => b[1] - a[1]);


    if (!sorted.length) {

        document.getElementById(
            "mostReportedZone"
        ).textContent =
            "No reports yet";

        document.getElementById(
            "mostReportedZoneCount"
        ).textContent =
            "0 issue reports recorded";

        return;
    }


    const [zone,count] =
        sorted[0];


    document.getElementById(
        "mostReportedZone"
    ).textContent =
        zone;

    document.getElementById(
        "mostReportedZoneCount"
    ).textContent =
        `${count} issue reports recorded`;
}


// =====================================================
// ALL CASES
// =====================================================

function renderCases(reports) {

    const container =
        document.getElementById(
            "allCasesList"
        );

    container.innerHTML = "";


    if (!reports.length) {

        container.innerHTML = `
            <div class="case-card">
                <div class="case-main">
                    <strong>No cases reported yet.</strong>
                    <p>New student reports will appear here.</p>
                </div>
            </div>
        `;

        return;
    }


    [...reports]
        .reverse()
        .forEach(report => {

            const card =
                document.createElement("div");

            card.className =
                "case-card";


            const statusClass =
                report.status === "Resolved"
                    ? "status-resolved"
                    : "status-open";


            card.innerHTML = `

                <div class="case-main">

                    <strong>
                        ${escapeHTML(report.issue)}
                    </strong>

                    <p>
                        📍 ${escapeHTML(report.building)}
                        • ${escapeHTML(report.floor)}
                        • ${escapeHTML(report.room)}
                    </p>

                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(report.status || "Open")}
                    </span>

                </div>


                <div class="case-actions">

                    <button
                        class="full-case-button"
                        onclick="viewFullCase(${report.id})">

                        View Full Case

                    </button>

                    ${
                        report.status !== "Resolved"
                        ? `
                        <button
                            class="resolve-button"
                            onclick="startResolve(${report.id})">

                            Resolve

                        </button>
                        `
                        : ""
                    }

                </div>

            `;

            container.appendChild(card);
        });
}


// =====================================================
// FULL CASE
// =====================================================

async function viewFullCase(id) {

    try {

        const response =
            await fetch(
                `${API}/api/reports/${id}`
            );


        if (!response.ok) {
            throw new Error();
        }


        const data =
            await response.json();


        const report =
            data.report;


        if (!report) {

            alert(
                "Case not found."
            );

            return;
        }


        const details =
            document.getElementById(
                "caseDetails"
            );


        const mediaURL =
            report.media
                ? `${API}${report.media}`
                : null;


        let mediaHTML =
            `<p style="color:#7a8495">
                No evidence attached to this case.
             </p>`;


        if (
            mediaURL &&
            report.mediaType === "photo"
        ) {

            mediaHTML = `

                <div class="case-media">

                    <h3>📷 Photo Evidence</h3>

                    <img
                        src="${mediaURL}"
                        alt="Issue evidence">

                </div>

            `;

        }


        if (
            mediaURL &&
            report.mediaType === "video"
        ) {

            mediaHTML = `

                <div class="case-media">

                    <h3>🎥 Video Evidence</h3>

                    <video
                        src="${mediaURL}"
                        controls>
                    </video>

                </div>

            `;
        }


        details.innerHTML = `

            <div class="case-detail-header">

                <h2>
                    ${escapeHTML(report.issue)}
                </h2>

                <div class="case-meta">

                    <span>
                        📍 ${escapeHTML(report.building)}
                    </span>

                    <span>
                        🏢 ${escapeHTML(report.floor)}
                    </span>

                    <span>
                        🚪 ${escapeHTML(report.room)}
                    </span>

                    <span>
                        🎯 ${escapeHTML(report.priority || "Low")}
                    </span>

                    <span>
                        ${report.status === "Resolved"
                            ? "✅ Resolved"
                            : "⚠️ Open"}
                    </span>

                </div>

            </div>


            <div class="case-description">

                <strong>📝 Description</strong>

                <p>
                    ${
                        escapeHTML(
                            report.description ||
                            "No description provided."
                        )
                    }
                </p>

            </div>


            ${mediaHTML}


            <div style="margin-top:25px;color:#7a8495;font-size:12px">

                Case ID:
                <strong>#${report.id}</strong>

            </div>

        `;


        document.getElementById(
            "caseModal"
        ).style.display = "flex";


    } catch (error) {

        console.error(error);

        alert(
            "❌ Could not load full case."
        );
    }
}


function closeCaseModal() {

    document.getElementById(
        "caseModal"
    ).style.display = "none";
}


// =====================================================
// OTP RESOLUTION
// =====================================================

async function startResolve(reportId) {

    try {

        const response =
            await fetch(
                `${API}/api/reports/${reportId}/resolve`,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                "Could not start resolution."
            );

            return;
        }


        alert(
            "🔐 CAMPUSFIX DEMO OTP\n\n" +
            "OTP: " +
            data.demoOtp +
            "\n\n" +
            "Demo mode: in the real system " +
            "this would be sent to the student's phone."
        );


        const otp =
            prompt(
                "Enter the 6-digit OTP:"
            );


        if (!otp) return;


        const verifyResponse =
            await fetch(
                `${API}/api/reports/${reportId}/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        otp: otp
                    })
                }
            );


        const verifyData =
            await verifyResponse.json();


        if (!verifyData.success) {

            alert(
                "❌ Incorrect OTP."
            );

            return;
        }


        alert(
            "✅ ISSUE RESOLVED!\n\n" +
            "The case has been closed successfully."
        );


        await loadAdminDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "❌ Could not resolve issue."
        );
    }
}


// =====================================================
// QR
// =====================================================

function generateQRCode() {

    const container =
        document.getElementById("qrcode");

    if (!container) return;

    container.innerHTML = "";

    new QRCode(
        container,
        {
            text:
                window.location.href.split("?")[0],

            width: 145,
            height: 145,

            correctLevel:
                QRCode.CorrectLevel.H
        }
    );
}


// =====================================================
// QR LOCATION
// =====================================================

function applyQRLocation() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const building =
        params.get("building");

    const floor =
        params.get("floor");

    const room =
        params.get("room");


    if (!building || !floor || !room) {
        return;
    }


    const buildingSelect =
        document.getElementById(
            "buildingSelect"
        );

    const floorSelect =
        document.getElementById(
            "floorSelect"
        );

    const roomSelect =
        document.getElementById(
            "roomSelect"
        );


    buildingSelect.value =
        building;

    updateFloors();

    floorSelect.value =
        floor;

    updateRooms();

    roomSelect.value =
        room;

    reportProblem();
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// START
// =====================================================

generateQRCode();
applyQRLocation();
