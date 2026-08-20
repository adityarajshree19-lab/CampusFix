// ========================================
// CAMPUSFIX - MAIN JAVASCRIPT
// ========================================


// ========================================
// REPORT MODAL
// ========================================

function reportProblem() {

    const modal = document.getElementById("reportModal");

    if (modal) {
        modal.style.display = "flex";
    }

}


function closeReportModal() {

    const modal = document.getElementById("reportModal");

    if (modal) {
        modal.style.display = "none";
    }

}


// ========================================
// SHOW ADMIN DASHBOARD
// ========================================

function showDashboard() {

    const dashboard =
        document.getElementById("dashboardSection");

    if (!dashboard) {
        console.error("Dashboard section not found.");
        return;
    }

    dashboard.style.display = "block";

    loadAdminDashboard();

    dashboard.scrollIntoView({
        behavior: "smooth"
    });

}


// ========================================
// SUBMIT REPORT
// ========================================

async function submitReport() {

    const building =
        document.getElementById("buildingSelect").value;

    const floor =
        document.getElementById("floorSelect").value;

    const room =
        document.getElementById("roomSelect").value;

    const issue =
        document.getElementById("issueSelect").value;

    const description =
        document.getElementById("description").value;


    // Required fields
    if (!building || !floor || !room || !issue) {

        alert(
            "⚠️ Please complete all required fields."
        );

        return;
    }


    const report = {

        building: building,

        floor: floor,

        room: room,

        issue: issue,

        description: description

    };


    try {

        const response = await fetch(
            "https://campusfix-xzjb.onrender.com/api/reports",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(report)
            }
        );


        if (!response.ok) {

            throw new Error(
                "Backend returned an error."
            );

        }


        const data =
            await response.json();


        if (data.success) {

            alert(
                "✅ Report Submitted Successfully!\n\n" +
                "📍 " + building + "\n" +
                "🏢 " + floor + "\n" +
                "🚪 " + room + "\n" +
                "🎯 " + issue
            );


            closeReportModal();


            // Reset form
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

        } else {

            alert(
                "❌ Report could not be submitted."
            );

        }


    } catch (error) {

        console.error(
            "Backend Error:",
            error
        );

        alert(
            "❌ Backend connection failed.\n\n" +
            "Please make sure CampusFix backend is running."
        );

    }

}


// ========================================
// FLOOR SYSTEM
// ========================================

function updateFloors() {

    const building =
        document.getElementById(
            "buildingSelect"
        ).value;

    const floorSelect =
        document.getElementById(
            "floorSelect"
        );

    const roomSelect =
        document.getElementById(
            "roomSelect"
        );


    floorSelect.innerHTML = "";

    roomSelect.innerHTML = "";

    roomSelect.disabled = true;


    if (!building) {

        floorSelect.disabled = true;

        floorSelect.innerHTML =
            '<option value="">Select Building First</option>';

        roomSelect.innerHTML =
            '<option value="">Select Floor First</option>';

        return;
    }


    floorSelect.disabled = false;

    floorSelect.innerHTML =
        '<option value="">Select Floor</option>';


    // E2 and GLA
    if (
        building === "E2" ||
        building === "GLA"
    ) {

        addFloor("Ground Floor");
        addFloor("First Floor");
        addFloor("Second Floor");
        addFloor("Third Floor");

    }

    // Library / Gym
    else if (
        building === "Library" ||
        building === "Gym"
    ) {

        addFloor("Ground Floor");

    }

    // Hostels
    else {

        addFloor("Ground Floor");
        addFloor("First Floor");
        addFloor("Second Floor");
        addFloor("Third Floor");

    }


    function addFloor(name) {

        const option =
            document.createElement("option");

        option.value = name;

        option.textContent = name;

        floorSelect.appendChild(option);

    }

}


// ========================================
// ROOM SYSTEM
// ========================================

function updateRooms() {

    const building =
        document.getElementById(
            "buildingSelect"
        ).value;

    const floor =
        document.getElementById(
            "floorSelect"
        ).value;

    const roomSelect =
        document.getElementById(
            "roomSelect"
        );


    roomSelect.innerHTML =
        '<option value="">Select Room / Area</option>';


    if (!floor) {

        roomSelect.disabled = true;

        return;
    }


    roomSelect.disabled = false;


    // E2
    if (building === "E2") {

        const rooms =
            getRooms("NB", floor);

        rooms.forEach(addRoom);

    }


    // GLA
    else if (building === "GLA") {

        const rooms =
            getRooms("GA", floor);

        rooms.forEach(addRoom);

    }


    // Library
    else if (building === "Library") {

        addRoom("Main Library");

        addRoom("Reading Area");

        addRoom("Study Area");

    }


    // Gym
    else if (building === "Gym") {

        addRoom("Main Gym");

        addRoom("Equipment Area");

        addRoom("Training Area");

    }


    // Hostels
    else {

        const rooms =
            getRooms("Room", floor);

        rooms.forEach(addRoom);

    }


    function addRoom(room) {

        const option =
            document.createElement("option");

        option.value = room;

        option.textContent = room;

        roomSelect.appendChild(option);

    }

}


// ========================================
// GENERATE ROOMS
// ========================================

function getRooms(prefix, floor) {

    let floorNumber;


    if (floor === "Ground Floor") {

        floorNumber = "0";

    }

    else if (floor === "First Floor") {

        floorNumber = "1";

    }

    else if (floor === "Second Floor") {

        floorNumber = "2";

    }

    else {

        floorNumber = "3";

    }


    const rooms = [];


    for (let i = 1; i <= 10; i++) {

        const roomNumber =
            String(i).padStart(2, "0");

        rooms.push(
            prefix +
            floorNumber +
            roomNumber
        );

    }


    return rooms;

}


// ========================================
// ADMIN DASHBOARD
// ========================================

async function loadAdminDashboard() {

    try {

        const response =
            await fetch(
                "https://campusfix-xzjb.onrender.com/api/reports"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load reports."
            );

        }


        const data =
            await response.json();


        const reports =
            data.reports || [];


        // ========================================
        // COUNTS
        // ========================================

        const totalReports =
            reports.length;


        const activeReports =
            reports.filter(
                report =>
                    report.status === "Open"
            );


        const resolvedReports =
            reports.filter(
                report =>
                    report.status === "Resolved"
            );


        const highPriorityReports =
            reports.filter(
                report =>
                    report.status === "Open" &&
                    report.priority === "High"
            );


        // ========================================
        // UPDATE STAT CARDS
        // ========================================

        const totalElement =
            document.getElementById(
                "totalReports"
            );

        const activeElement =
            document.getElementById(
                "activeReports"
            );

        const resolvedElement =
            document.getElementById(
                "resolvedReports"
            );

        const highElement =
            document.getElementById(
                "highPriorityReports"
            );


        if (totalElement) {

            totalElement.textContent =
                totalReports;

        }


        if (activeElement) {

            activeElement.textContent =
                activeReports.length;

        }


        if (resolvedElement) {

            resolvedElement.textContent =
                resolvedReports.length;

        }


        if (highElement) {

            highElement.textContent =
                highPriorityReports.length;

        }


     // ========================================
// CAMPUS HEALTH - SYNCED HOMEPAGE + DASHBOARD
// ========================================

let healthScore =
    100 -
    (activeReports.length * 2) -
    (highPriorityReports.length * 5);


// Never go below 0
if (healthScore < 0) {
    healthScore = 0;
}


// ========================================
// DASHBOARD HEALTH SCORE
// ========================================

const healthElement =
    document.getElementById("campusHealthScore");

if (healthElement) {
    healthElement.textContent = healthScore;
}


// ========================================
// HOMEPAGE HEALTH SCORE
// ========================================

const homeHealthElement =
    document.getElementById("homeHealthScore");

if (homeHealthElement) {
    homeHealthElement.textContent =
        healthScore + "%";
}


// ========================================
// HEALTH STATUS
// ========================================

let statusText;

if (healthScore >= 80) {

    statusText = "🟢 Good";

}

else if (healthScore >= 50) {

    statusText = "🟡 Needs Attention";

}

else {

    statusText = "🔴 Critical";

}


// Dashboard status
const dashboardStatus =
    document.querySelector(
        "#dashboardSection .health-status"
    );

if (dashboardStatus) {
    dashboardStatus.textContent =
        statusText;
}


// Homepage status
const homeStatus =
    document.getElementById(
        "homeHealthStatus"
    );

if (homeStatus) {
    homeStatus.textContent =
        statusText;
}


// ========================================
// HOMEPAGE PROGRESS BAR
// ========================================

const homeProgress =
    document.getElementById(
        "homeHealthProgress"
    );

if (homeProgress) {

    homeProgress.style.width =
        healthScore + "%";

}


        // ========================================
        // FIRST DASHBOARD CARD
        // SHOW ALL OPEN ISSUES
        // ========================================

        const dashboardCards =
            document.querySelectorAll(
                ".dashboard-card"
            );


        const issueCard =
            dashboardCards[0];


        if (issueCard) {

            const oldItems =
                issueCard.querySelectorAll(
                    ".issue-item"
                );


            oldItems.forEach(
                item => item.remove()
            );


            // Show every open report
            activeReports.forEach(
                report => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "issue-item";


                    let priorityIcon =
                        "🟢";


                    if (
                        report.priority ===
                        "High"
                    ) {

                        priorityIcon = "🔴";

                    }

                    else if (
                        report.priority ===
                        "Medium"
                    ) {

                        priorityIcon = "🟡";

                    }


                    item.innerHTML = `

                        <div>

                            <strong>
                                ${priorityIcon}
                                ${report.issue}
                            </strong>

                            <p>
                                ${report.building}
                                • ${report.floor}
                                • ${report.room}
                            </p>

                            <small>
                                Priority:
                                ${report.priority}
                            </small>

                        </div>

                        <div>

                            <button
                                class="resolve-button"
                                onclick="startResolve(${report.id})">

                                ✓ Resolve

                            </button>

                        </div>

                    `;


                    issueCard.appendChild(
                        item
                    );

                }
            );


            // No active issues
            if (
                activeReports.length === 0
            ) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "issue-item";


                item.innerHTML = `

                    <div>

                        <strong>
                            🟢 All Issues Resolved
                        </strong>

                        <p>
                            Campus is currently under control.
                        </p>

                    </div>

                `;


                issueCard.appendChild(
                    item
                );

            }

        }


        // ========================================
        // RECURRING ISSUES
        // ========================================

        const issueCounts = {};


        reports.forEach(
            report => {

                if (
                    !issueCounts[report.issue]
                ) {

                    issueCounts[
                        report.issue
                    ] = 0;

                }


                issueCounts[
                    report.issue
                ]++;

            }
        );


        const recurringCard =
            dashboardCards[1];


        if (recurringCard) {

            const oldPatterns =
                recurringCard.querySelectorAll(
                    ".pattern-item"
                );


            oldPatterns.forEach(
                item => item.remove()
            );


            Object.entries(
                issueCounts
            )
            .sort(
                (a, b) => b[1] - a[1]
            )
            .forEach(
                ([issue, count]) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "pattern-item";


                    item.innerHTML = `

                        <span>
                            📊 ${issue}
                        </span>

                        <strong>
                            ${count} reports
                        </strong>

                    `;


                    recurringCard.appendChild(
                        item
                    );

                }
            );

        }


        console.log(
            "CampusFix Dashboard Updated",
            reports
        );


    }

    catch (error) {

        console.error(
            "Dashboard loading failed:",
            error
        );


        alert(
            "❌ Could not load dashboard.\n\n" +
            "Please make sure the backend is running."
        );

    }

}


// ========================================
// RESOLVE ISSUE
// ========================================

async function startResolve(reportId) {

    try {

        // ========================================
        // STEP 1
        // ASK BACKEND TO GENERATE OTP
        // ========================================

        const resolveResponse =
            await fetch(
                `https://campusfix-xzjb.onrender.com/api/reports/${reportId}/resolve`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (!resolveResponse.ok) {

            throw new Error(
                "Could not generate OTP."
            );

        }


        const resolveData =
            await resolveResponse.json();


        if (!resolveData.success) {

            alert(
                "❌ Could not start resolution."
            );

            return;

        }


        // ========================================
        // DEMO OTP
        // ========================================

        const demoOtp =
            resolveData.demoOtp;


        alert(
            "🔐 CAMPUSFIX DEMO OTP\n\n" +
            "OTP: " +
            demoOtp +
            "\n\n" +
            "In the real system this OTP " +
            "would be sent to the student's phone."
        );


        // ========================================
        // ADMIN ENTERS OTP
        // ========================================

        const enteredOtp =
            prompt(
                "🔐 Enter the 6-digit OTP:"
            );


        if (!enteredOtp) {

            return;

        }


        // ========================================
        // VERIFY OTP WITH BACKEND
        // ========================================

        const verifyResponse =
            await fetch(
                `https://campusfix-xzjb.onrender.com/api/reports/${reportId}/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        otp: enteredOtp
                    })
                }
            );


        if (!verifyResponse.ok) {

            throw new Error(
                "OTP verification failed."
            );

        }


        const verifyData =
            await verifyResponse.json();


        // ========================================
        // WRONG OTP
        // ========================================

        if (!verifyData.success) {

            alert(
                "❌ Incorrect OTP!\n\n" +
                "The issue is still active."
            );

            return;

        }


        // ========================================
        // SUCCESS
        // ========================================

        alert(
            "✅ ISSUE RESOLVED!\n\n" +
            "OTP verified successfully.\n\n" +
            "The case has been closed."
        );


        // ========================================
        // REFRESH DASHBOARD
        // ========================================

        await loadAdminDashboard();

    }


    catch (error) {

        console.error(
            "Resolve error:",
            error
        );


        alert(
            "❌ Could not resolve the issue.\n\n" +
            "Make sure CampusFix backend is running."
        );

    }

}


// ========================================
// TEST BACKEND CONNECTION
// ========================================

async function testBackend() {

    try {

        const response =
            await fetch(
                "https://campusfix-xzjb.onrender.com/"
            );


        const message =
            await response.text();


        console.log(
            "CampusFix Backend:",
            message
        );

    }

    catch (error) {

        console.log(
            "CampusFix Backend connection failed."
        );

    }

}


// ========================================
// START BACKEND TEST
// ========================================
// ========================================
// QR LOCATION SYSTEM
// ========================================

function applyQRLocation() {

    const params = new URLSearchParams(
        window.location.search
    );

    const building = params.get("building");
    const floor = params.get("floor");
    const room = params.get("room");

    if (!building || !floor || !room) {
        return;
    }

    const buildingSelect =
        document.getElementById("buildingSelect");

    const floorSelect =
        document.getElementById("floorSelect");

    const roomSelect =
        document.getElementById("roomSelect");

    if (!buildingSelect) {
        return;
    }

    // Select building
    buildingSelect.value = building;

    // Generate floors
    updateFloors();

    // Select floor
    floorSelect.value = floor;

    // Generate rooms
    updateRooms();

    // Select room
    roomSelect.value = room;

    console.log(
        "📍 QR Location Applied:",
        building,
        floor,
        room
    );

}


// Run QR location detection
applyQRLocation();
testBackend();

// ========================================
// CAMPUSFIX QR CODE
// ========================================

function generateQRCode() {

    const qrContainer =
        document.getElementById("qrcode");

    if (!qrContainer) {
        return;
    }

    qrContainer.innerHTML = "";

    new QRCode(qrContainer, {
        text: window.location.href.split("?")[0],
        width: 145,
        height: 145,
        correctLevel: QRCode.CorrectLevel.H
    });

}

generateQRCode();
