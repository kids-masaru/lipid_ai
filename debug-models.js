const fs = require('fs');
const path = require('path');

async function checkModels() {
    try {
        // 1. Read API Key from .env.local
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error("❌ .env.local not found!");
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);

        if (!match || !match[1]) {
            console.error("❌ GEMINI_API_KEY not found in .env.local");
            return;
        }

        const apiKey = match[1].trim();
        console.log("✅ API Key found (length: " + apiKey.length + ")");

        // 2. Call API to list models
        console.log("📡 Fetching available models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error("Response:", errorBody);
            return;
        }

        const data = await response.json();

        if (!data.models) {
            console.log("⚠️ No models returned in list.");
            console.log(JSON.stringify(data, null, 2));
            return;
        }

        console.log("\n📋 Available Models:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
            }
        });

    } catch (error) {
        console.error("❌ Unexpected Error:", error);
    }
}

checkModels();
