// =====================================================
// CAMPUSFIX FINAL JAVASCRIPT
// =====================================================

const API = "http://localhost:5000";

let selectedMedia = null;
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingType = null;
let currentUser = null;
let adminStaffList = [];

function apiFetch(url, options) {

    options = options || {};

    return fetch(
        API + url,
        Object.assign(
            {},
            options,
            {
                credentials: "include",
                headers: options.headers || {}
            }
        )
    );
}


async function fetchCurrentUser() {

    try {

        const response =
            await apiFetch("/api/me");

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        return data.user || null;

    } catch (error) {

        return null;
    }
}


function applyAuthUI() {

    const slot =
        document.getElementById("navAuthSlot");

    if (slot) {

        if (!currentUser) {

            slot.innerHTML =
                '<a class="nav-button" href="/login.html">Login</a>';

        } else {

            slot.innerHTML = `
                <span class="nav-user">
                    ${escapeHTML(currentUser.email)}
                </span>
                <button
                    class="nav-button"
                    type="button"
                    onclick="logoutUser()">
                    Log out
                </button>
            `;
        }
    }


    const secondary =
        document.getElementById(
            "heroSecondaryButton"
        );

    if (secondary) {

        if (
            currentUser &&
            currentUser.role === "admin"
        ) {

            secondary.textContent =
                "📊 View Dashboard";

            secondary.onclick =
                showDashboard;

        } else if (currentUser) {

            secondary.textContent =
                "📋 My Complaints";

            secondary.onclick =
                showMyComplaints;

        } else {

            secondary.textContent =
                "📊 View Dashboard";

            secondary.onclick =
                showDashboard;
        }
    }


    const mine =
        document.getElementById(
            "myComplaintsSection"
        );

    if (mine) {

        mine.style.display =
            currentUser
                ? "block"
                : "none";
    }
}


function afterAuthRedirect() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const next =
        params.get("next");

    if (
        next &&
        next.charAt(0) === "/" &&
        next.charAt(1) !== "/"
    ) {

        window.location.href = next;
        return;
    }

    window.location.href = "/";
}


async function handleLogin(event) {

    event.preventDefault();

    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;

    try {

        const response =
            await apiFetch(
                "/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Could not log in."
            );

            return false;
        }

        afterAuthRedirect();

    } catch (error) {

        alert(
            "❌ Could not connect to CampusFix backend."
        );
    }

    return false;
}


async function handleSignup(event) {

    event.preventDefault();

    const email =
        document.getElementById(
            "signupEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "signupPassword"
        ).value;

    try {

        const response =
            await apiFetch(
                "/api/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Could not create account."
            );

            return false;
        }

        afterAuthRedirect();

    } catch (error) {

        alert(
            "❌ Could not connect to CampusFix backend."
        );
    }

    return false;
}


async function logoutUser() {

    await apiFetch(
        "/api/auth/logout",
        {
            method: "POST"
        }
    );

    window.location.href = "/";
}


function showMyComplaints() {

    const section =
        document.getElementById(
            "myComplaintsSection"
        );

    if (!section) {
        return;
    }

    section.style.display = "block";

    section.scrollIntoView({
        behavior: "smooth"
    });

    loadMyComplaints();
}


// =====================================================
// REPORT MODAL
// =====================================================

async function reportProblem() {

    if (!currentUser) {
        currentUser = await fetchCurrentUser();
    }

    if (!currentUser) {

        const next =
            window.location.pathname +
            window.location.search;

        window.location.href =
            "/login.html?next=" +
            encodeURIComponent(next);

        return;
    }

    const modal =
        document.getElementById("reportModal");

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeReportModal() {
    document.getElementById("reportModal").style.display = "none";
}


// =====================================================
// DASHBOARD
// =====================================================

function showDashboard() {

    window.location.href = "/dashboard";
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
            "Please allow access in your browser settings " +
            "and try again."
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

    const studentContact =
        document.getElementById(
            "contactNumber"
        ).value.trim();

    const contactError = document.getElementById("contactError");
    contactError.style.display = "none";

    if (
        !building ||
        !floor ||
        !room ||
        !issue ||
        !studentContact
    ) {

        alert(
            "⚠️ Please complete all required fields."
        );

        return;
    }
    
    const phoneRegex = /^[0-9+-s()]{10,15}$/;
    if (!phoneRegex.test(studentContact)) {
        contactError.style.display = "block";
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
    
    formData.append(
        "studentContact",
        studentContact
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
            await apiFetch(
                "/api/reports",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (response.status === 401) {

            alert(
                "Please log in to submit a report."
            );

            window.location.href =
                "/login.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Report submission failed."
            );

        }


        if (data.success) {

            // alert("✅ Report Submitted Successfully!");
            document.getElementById("successReportId").innerText = data.report.id;
            document.getElementById("successModal").style.display = "flex";

            closeReportModal();

            resetReportForm();

            loadMyComplaints();

            loadCampusSummary();

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
        const filterStatus = document.getElementById("adminStatusFilter")?.value || "All";
        let fetchUrl = "/api/admin/complaints";
        if (filterStatus !== "All") {
            fetchUrl += `?status=${encodeURIComponent(filterStatus)}`;
        }

        const staffRes = await apiFetch("/api/admin/staff");
        if (staffRes.ok) {
            const staffData = await staffRes.json();
            if (staffData.success) {
                adminStaffList = staffData.staff || [];
            }
        }

        const response = await apiFetch(fetchUrl);

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (response.status === 403) {
            window.location.href = "/unauthorized.html";
            return;
        }

        if (!response.ok) {
            throw new Error();
        }

        const data = await response.json();
        let reports = data.reports || [];

        // Apply text search
        const searchQuery = document.getElementById("adminSearchInput")?.value.toLowerCase().trim() || "";
        if (searchQuery) {
            reports = reports.filter(r => 
                (r.room && r.room.toLowerCase().includes(searchQuery)) ||
                (r.studentContact && r.studentContact.toLowerCase().includes(searchQuery))
            );
        }

        const active = reports.filter(r => r.status !== "Resolved");

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

function setElementText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function updateHealth(active, high) {

    let score =
        100 -
        active * 2 -
        high * 5;

    score =
        Math.max(0, score);

    setElementText(
        "campusHealthScore",
        score
    );

    setElementText(
        "homeHealthScore",
        score + "%"
    );

    const progress =
        document.getElementById(
            "homeHealthProgress"
        );

    if (progress) {

        progress.style.width =
            score + "%";
    }


    let status =
        "🟢 Good";

    if (score < 80 && score >= 50) {
        status = "🟡 Needs Attention";
    }

    if (score < 50) {
        status = "🔴 Critical";
    }


    setElementText(
        "dashboardHealthStatus",
        status
    );

    setElementText(
        "homeHealthStatus",
        status
    );
}


// =====================================================
// ACTIVE ISSUES
// =====================================================

function renderActiveIssues(active) {

    const container =
        document.getElementById(
            "activeIssueList"
        );

    if (!container) {
        return;
    }

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

    if (!container) {
        return;
    }

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

        setElementText(
            "mostReportedZone",
            "No reports yet"
        );

        setElementText(
            "mostReportedZoneCount",
            "0 issue reports recorded"
        );

        return;
    }


    const [zone,count] =
        sorted[0];


    setElementText(
        "mostReportedZone",
        zone
    );

    setElementText(
        "mostReportedZoneCount",
        `${count} issue reports recorded`
    );
}


// =====================================================
// ALL CASES
// =====================================================

function renderCases(reports) {

    const container =
        document.getElementById(
            "allCasesList"
        );

    if (!container) {
        return;
    }

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


            let statusClass = "status-open";
            if (report.status === "Pending") statusClass = "status-pending";
            else if (report.status === "Accepted") statusClass = "status-seen"; // mapping accepted to the blue badge
            else if (report.status === "In Progress") statusClass = "status-progress";
            else if (report.status === "Resolved") statusClass = "status-resolved";


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

                    <div class="admin-case-controls">

                        <label>
                            Priority
                            <select
                                onchange="updateReportField(${report.id}, 'priority', this.value)">

                                <option value="Low" ${report.priority === "Low" ? "selected" : ""}>
                                    Low
                                </option>
                                <option value="Medium" ${report.priority === "Medium" ? "selected" : ""}>
                                    Medium
                                </option>
                                <option value="High" ${report.priority === "High" ? "selected" : ""}>
                                    High
                                </option>

                            </select>
                        </label>

                        <label>
                            Status
                            <select
                                onchange="updateReportField(${report.id}, 'status', this.value)">

                                <option value="Open" ${report.status !== "Resolved" ? "selected" : ""}>
                                    Open
                                </option>
                                <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>
                                    Resolved
                                </option>

                            </select>
                        </label>

                    </div>

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
            await apiFetch(
                `/api/reports/${id}`
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

        let timelineHTML = '';
        const notes = report.adminNotes || [];
        if (notes.length > 0) {
            timelineHTML = `
                <div class="case-timeline" style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                    <h3 style="font-size: 14px; margin-bottom: 10px;">🕒 Action History</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${notes.map(h => `
                            <li style="margin-bottom: 10px; padding-left: 15px; border-left: 2px solid #3b82f6;">
                                <strong>${h.status}</strong> 
                                <span style="font-size: 12px; color: #6b7280;">(${new Date(h.updatedAt).toLocaleString()})</span>
                                ${h.note ? `<br><span style="font-size: 13px; color: #374151;">${escapeHTML(h.note)}</span>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        let assignedStaffHTML = '';
        if (report.maintenanceStaff) {
            assignedStaffHTML = `
                <div style="margin-top: 15px; padding: 10px; border: 1px dashed #9ca3af; border-radius: 6px;">
                    <strong>👷 Assigned Staff:</strong> ${escapeHTML(report.maintenanceStaff.name || 'N/A')} (${escapeHTML(report.maintenanceStaff.role || '')})<br>
                    📞 ${escapeHTML(report.maintenanceStaff.contactNumber || '')} <br>
                    ⏳ Expected Arrival: ${escapeHTML(report.expectedArrival ? new Date(report.expectedArrival).toLocaleString() : 'N/A')}<br>
                    🎯 Expected Resolution: ${escapeHTML(report.expectedResolutionDate ? new Date(report.expectedResolutionDate).toLocaleString() : 'N/A')}
                </div>
            `;
        }

        const isAdmin = currentUser && currentUser.role === "admin";
        let adminControlsHTML = '';

        if (isAdmin) {
            if (report.status === "Pending") {
                adminControlsHTML = `
                    <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                        <h3>🛠️ Accept Complaint</h3>
                        <form onsubmit="return handleAdminAccept(event, ${report.id})">
                            <label style="display:block; margin-top:10px;">Assign Staff Member
                                <select id="staffId" required style="width:100%; padding:8px; margin-top:5px;" onchange="updateStaffContact(this.value)">
                                    <option value="">Select Staff...</option>
                                    ${adminStaffList.map(staff => `<option value="${staff.id}">${escapeHTML(staff.name)} — ${escapeHTML(staff.role)}</option>`).join('')}
                                </select>
                            </label>
                            <div id="staffContactDisplay" style="margin-top: 5px; font-size: 14px; color: #4b5563;"></div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top:10px;">
                                <label style="display:block;">Expected Arrival
                                    <input type="datetime-local" id="expectedArrival" required style="width:100%; padding:8px; margin-top:5px;">
                                </label>
                                <label style="display:block;">Expected Resolution (Optional)
                                    <input type="datetime-local" id="expectedResolution" style="width:100%; padding:8px; margin-top:5px;">
                                </label>
                            </div>
                            <button type="submit" style="margin-top:15px; padding:10px; background:#2563eb; color:white; border:none; border-radius:6px; cursor:pointer; width:100%;">
                                Accept & Assign Staff
                            </button>
                        </form>
                    </div>
                `;
            } else if (report.status === "Accepted" || report.status === "In Progress") {
                adminControlsHTML = `
                    <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                        <h3>🔄 Update Progress</h3>
                        <form onsubmit="return handleAdminUpdate(event, ${report.id})">
                            <label style="display:block; margin-top:10px;">Change Status
                                <select id="updateStatus" style="width:100%; padding:8px; margin-top:5px;">
                                    <option value="">Keep Current Status (${report.status})</option>
                                    <option value="In Progress">Mark as In Progress</option>
                                </select>
                            </label>
                            <label style="display:block; margin-top:10px;">Admin Note (Optional)
                                <input type="text" id="updateNote" placeholder="e.g. Parts arrived, starting work" style="width:100%; padding:8px; margin-top:5px;">
                            </label>
                            
                            <div style="margin-top: 15px; cursor: pointer; color: #2563eb; font-weight: bold; font-size: 14px;" onclick="document.getElementById('editStaffSection').style.display='block'">
                                ✏️ Edit Staff / ETA Details (Optional)
                            </div>
                            <div id="editStaffSection" style="display:none; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                                <label style="display:block;">Reassign Staff Member (Optional)
                                    <select id="editStaffId" style="width:100%; padding:8px; margin-top:5px;" onchange="updateEditStaffContact(this.value)">
                                        <option value="">Keep current staff (${report.maintenanceStaff?.name || 'None'})</option>
                                        ${adminStaffList.map(staff => `<option value="${staff.id}">${escapeHTML(staff.name)} — ${escapeHTML(staff.role)}</option>`).join('')}
                                    </select>
                                </label>
                                <div id="editStaffContactDisplay" style="margin-top: 5px; font-size: 14px; color: #4b5563;"></div>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top:10px;">
                                    <input type="datetime-local" id="editExpectedArrival" style="padding:8px;" value="${report.expectedArrival ? report.expectedArrival.substring(0,16) : ''}">
                                    <input type="datetime-local" id="editExpectedResolution" style="padding:8px;" value="${report.expectedResolutionDate ? report.expectedResolutionDate.substring(0,16) : ''}">
                                </div>
                            </div>
                            
                            <button type="submit" style="margin-top:15px; padding:10px; background:#16a34a; color:white; border:none; border-radius:6px; cursor:pointer; width:100%;">
                                Update Complaint
                            </button>
                        </form>
                    </div>
                `;
            }
        }

        let contactHTML = report.studentContact ? 
            `<span>📞 ${escapeHTML(report.studentContact)}</span>` : '';


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
                            : "⚠️ " + report.status}
                    </span>
                    
                    ${contactHTML}

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
            
            ${assignedStaffHTML}
            
            ${timelineHTML}
            
            ${adminControlsHTML}


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
            await apiFetch(
                `/api/reports/${reportId}/resolve`,
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
            "🔒 CAMPUSFIX DEMO OTP\n\n" +
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
            await apiFetch(
                `/api/reports/${reportId}/verify-otp`,
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

    if (!buildingSelect) {
        return;
    }

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

// =====================================================
// START
// =====================================================

async function loadCampusSummary() {

    try {

        const response =
            await apiFetch(
                "/api/campus-summary"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        updateHealth(
            data.activeCount || 0,
            data.highCount || 0
        );

    } catch (error) {
        console.error(error);
    }
}


async function loadMyComplaints() {

    const container =
        document.getElementById(
            "myComplaintsList"
        );

    if (!container || !currentUser) {
        return;
    }

    try {

        const response =
            await apiFetch(
                "/api/reports/mine"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        const reports =
            data.reports || [];

        container.innerHTML = "";

        if (!reports.length) {

            container.innerHTML = `
                <div class="case-card">
                    <div class="case-main">
                        <strong>No reports yet.</strong>
                        <p>When you submit an issue, it will appear here.</p>
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

                let statusClass = "status-open";
                if (report.status === "Pending") statusClass = "status-pending";
                else if (report.status === "Seen by Admin") statusClass = "status-seen";
                else if (report.status === "In Progress") statusClass = "status-progress";
                else if (report.status === "Resolved") statusClass = "status-resolved";

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

                    </div>

                `;

                container.appendChild(card);
            });

    } catch (error) {

        console.error(error);
    }
}


async function updateReportField(id, field, value) {

    try {

        const body = {};
        body[field] = value;

        const response =
            await apiFetch(
                `/api/reports/${id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(body)
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Could not update report."
            );

            return;
        }

        await loadAdminDashboard();

    } catch (error) {

        alert(
            "❌ Could not update report."
        );
    }
}


async function initCampusFix() {

    currentUser = await fetchCurrentUser();

    applyAuthUI();

    generateQRCode();

    applyQRLocation();

    await loadCampusSummary();

    if (window.CAMPUSFIX_PAGE === "dashboard") {

        await loadAdminDashboard();

    } else {

        await loadMyComplaints();
    }
}


initCampusFix();

function updateStaffContact(staffId) {
    const staff = adminStaffList.find(s => s.id == staffId);
    const display = document.getElementById("staffContactDisplay");
    if (staff && display) {
        display.innerHTML = `📞 ${escapeHTML(staff.contactNumber)}`;
    } else if (display) {
        display.innerHTML = "";
    }
}

function updateEditStaffContact(staffId) {
    const staff = adminStaffList.find(s => s.id == staffId);
    const display = document.getElementById("editStaffContactDisplay");
    if (staff && display) {
        display.innerHTML = `📞 ${escapeHTML(staff.contactNumber)}`;
    } else if (display) {
        display.innerHTML = "";
    }
}

async function handleAdminAccept(event, id) {
    event.preventDefault();
    if (!confirm("Are you sure you want to accept this complaint and dispatch staff?")) return false;
    
    const staffId = document.getElementById("staffId").value;
    const expectedArrival = document.getElementById("expectedArrival").value;
    const expectedResolutionDate = document.getElementById("expectedResolution").value || null;
    
    try {
        const response = await apiFetch(`/api/admin/complaints/${id}/accept`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staffId,
                expectedArrival,
                expectedResolutionDate
            })
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) {
            alert(data.message || "Could not accept complaint.");
            return false;
        }
        
        alert("✅ Complaint accepted successfully!");
        await openCaseModal(id);
        if (window.CAMPUSFIX_PAGE === "dashboard") {
            await loadAdminDashboard();
        }
    } catch (error) {
        console.error(error);
        alert("Could not accept complaint.");
    }
    return false;
}

async function handleAdminUpdate(event, id) {
    event.preventDefault();
    
    const status = document.getElementById("updateStatus").value;
    const note = document.getElementById("updateNote").value.trim();
    
    if (status === "Resolved" && !confirm("Are you sure you want to mark this complaint as Resolved?")) {
        return false;
    }
    
    const payload = {};
    if (status) payload.status = status;
    if (note) payload.note = note;
    
    const editStaffId = document.getElementById("editStaffId").value;
    if (editStaffId) {
        payload.staffId = editStaffId;
    }
    
    const editExpectedArrival = document.getElementById("editExpectedArrival").value;
    const editExpectedResolution = document.getElementById("editExpectedResolution").value;
    if (editExpectedArrival) payload.expectedArrival = editExpectedArrival;
    if (editExpectedResolution) payload.expectedResolutionDate = editExpectedResolution;
    
    try {
        const response = await apiFetch(`/api/admin/complaints/${id}/update`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) {
            alert(data.message || "Could not update complaint.");
            return false;
        }
        
        alert("✅ Complaint updated successfully!");
        await openCaseModal(id);
        if (window.CAMPUSFIX_PAGE === "dashboard") {
            await loadAdminDashboard();
        }
    } catch (error) {
        console.error(error);
        alert("Could not update complaint.");
    }
    
    return false;
}
