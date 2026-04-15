async function test() {
    try {
        console.log("Logging in as demo user or attempting to create one...");
        let token;
        try {
            let loginRes = await fetch('http://localhost:5000/api/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: "test@example.com", password: "password" })
            });
            if (!loginRes.ok) throw new Error("Login failed");
            let data = await loginRes.json();
            token = data.token;
        } catch (e) {
            await fetch('http://localhost:5000/api/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "password" })
            });
            let loginRes = await fetch('http://localhost:5000/api/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: "test@example.com", password: "password" })
            });
            let data = await loginRes.json();
            token = data.token;
        }

        console.log("Got token, posting to /api/medical");
        const payload = {
            allergies: "Test",
            maladies: "{\"selected\":[\"Asthme\"],\"other\":\"\"}",
            medicaments: "",
            bloodGroup: "O+",
            contactName: "Test Contact",
            contactPhone: "0000000",
            contactRelation: "Parent",
            birthDate: "2000-01-01",
            weight: "70",
            height: "170",
            organDonor: false,
            additionalNotes: ""
        };
        const res = await fetch('http://localhost:5000/api/medical', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const responseData = await res.json();
        if (!res.ok) {
            console.error("SERVER ERROR:", res.status, responseData);
        } else {
            console.log("SUCCESS:", responseData);
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
test();
