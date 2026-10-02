import dotenv from 'dotenv';
dotenv.config();

async function checkModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Testing API Key...");
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models`, {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    const data = await res.json();
    
    if (data.error) {
      console.error("API Error:", data.error.message);
    } else {
      console.log("\nAvailable Gemini Models:");
      data.models.forEach(model => {
        if (model.name.includes("gemini")) {
          console.log(`- ${model.name} (${model.displayName})`);
        }
      });
      console.log("\nAPI Key is valid and working!");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

checkModels();
