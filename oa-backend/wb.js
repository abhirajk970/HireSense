const axios = require('axios');
async function run() {
    try {
        const payload = {
            compiler: "gcc-head",
            code: "#include <iostream>\\nusing namespace std;\\nint main() { cout << \\"15\\"; return 0; }",
            stdin: ""
        };
        const res = await axios.post("https://wandbox.org/api/compile.json", payload);
        console.log(Object.keys(res.data));
        console.log("OUT:", res.data.program_message);
    } catch(err) { console.error(err); }
}
run();
