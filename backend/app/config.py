import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend or root directory
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    root_env = Path(__file__).resolve().parent.parent.parent / ".env"
    if root_env.exists():
        load_dotenv(root_env)

# Configuration settings
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()

# Model identifier: openrouter:openrouter/free
MODEL_NAME = os.getenv("MODEL_NAME", "openrouter:openrouter/free").strip()

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# CORS Allowed Origins
_raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001")
CORS_ORIGINS = [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]
if "*" not in CORS_ORIGINS:
    CORS_ORIGINS.append("*")  # Permissive for local dev / demo deployment

# Disable pydantic-ai ASCII banner in production logs
os.environ["PYDANTIC_AI_NO_BANNER"] = "1"
if OPENROUTER_API_KEY:
    os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY


def is_model_configured() -> bool:
    """Check if a valid model API key is set."""
    return bool(OPENROUTER_API_KEY and not OPENROUTER_API_KEY.startswith("your_"))
