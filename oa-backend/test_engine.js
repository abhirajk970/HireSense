const axios = require('axios');
async function run() {
    try {
        const payload = {
            language: "c++",
            version: "*",
            files: [{ content: "#include <iostream>\\nint main(){std::cout<<15;return 0;}" }]
        };
        const res = await axios.post("https://piston.sillydev.co.uk/api/v2/execute", payload);
        console.log("PISTON C++ OUT:", res.data);
    } catch(err) { console.error("ERR:", err.message); }
}
run();
