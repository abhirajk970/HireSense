const axios = require('axios');

async function testEndpoint(url) {
    try {
        const res = await axios.post(url, {
            language: "javascript",
            version: "*",
            files: [{ content: "console.log('hello piston');" }]
        }, { timeout: 5000 });
        console.log(`[SUCCESS] ${url}:`, res.data.run ? res.data.run.stdout : res.data);
    } catch(err) {
        console.error(`[FAILED] ${url}:`, err.message);
    }
}

async function run() {
    await testEndpoint("https://emacs.piston.rs/api/v2/execute");
    await testEndpoint("https://piston.codeamn.com/api/v2/execute");
    await testEndpoint("https://judge0-ce.p.rapidapi.com/submissions");
}
run();
