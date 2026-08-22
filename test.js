async function test() {
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@campusfix.local", password: "choose-a-strong-password" })
    });
    const cookie = loginRes.headers.get("set-cookie");
    
    const reportRes = await fetch("http://localhost:3000/api/reports", {
        method: "GET",
        headers: { "Cookie": cookie }
    });
    
    const reportData = await reportRes.json();
    console.log("Reports:", reportData);
}
test();
