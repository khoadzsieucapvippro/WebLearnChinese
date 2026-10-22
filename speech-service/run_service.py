import os
import uvicorn

if __name__ == "__main__":
    host = os.getenv("SPEECH_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("SPEECH_PORT", "8000")))
    print(f"Starting Local Chinese Speech & Tone Evaluation Service on http://{host}:{port} ...")
    uvicorn.run("app.main:app", host=host, port=port, reload=False, log_level="info")

