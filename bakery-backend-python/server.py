import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))

if __name__ == "__main__":
    print(f"Starting server on http://localhost:{PORT}")
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=False)
