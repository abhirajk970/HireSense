const axios = require('axios');

async function checkPiston() {
    try {
        console.log("Checking Piston...");
        const res = await axios.post("https://emacs.piston.rs/api/v2/execute", {
            language: "javascript", version: "*", files: [{content: "console.log('hi');"}]
        }, { timeout: 15000 });
        console.log("Piston response:", res.data);
    } catch(err) { console.error("Piston err:", err.message); }
}

async function checkWandbox() {
    try {
        console.log("Checking Wandbox...");
        const res = await axios.post("https://wandbox.org/api/compile.json", {
            code: "console.log('hi wand');", compiler: "nodejs-head"
        }, { timeout: 15000 });
        console.log("Wandbox response:", res.data);
    } catch(err) { console.error("Wandbox err:", err.message); }
}

async function run() {
    await checkPiston();
    await checkWandbox();
}
run();
