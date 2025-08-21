# .env file - Easy configuration for multiple services
PORT_AGENT=8000
PORT_DOCTOR=8001
PORT_PHARMACY=8002
PORT_WELLNESS=8003
PORT_FRONTEND=3000
DEBUG=True
HOST=localhost

# Optional: Add API keys or other settings
OPENAI_API_KEY=your_api_key_here
LANGUAGE=en

---

# config.py - Load configuration for all services
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Service ports
    AGENT_PORT = int(os.getenv('PORT_AGENT', 8000))
    DOCTOR_PORT = int(os.getenv('PORT_DOCTOR', 8001))
    PHARMACY_PORT = int(os.getenv('PORT_PHARMACY', 8002))
    WELLNESS_PORT = int(os.getenv('PORT_WELLNESS', 8003))
    FRONTEND_PORT = int(os.getenv('PORT_FRONTEND', 3000))
    
    # Common settings
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    HOST = os.getenv('HOST', 'localhost')
    
    # API URLs for inter-service communication
    AGENT_URL = f"http://{HOST}:{AGENT_PORT}"
    DOCTOR_URL = f"http://{HOST}:{DOCTOR_PORT}"
    PHARMACY_URL = f"http://{HOST}:{PHARMACY_PORT}"
    WELLNESS_URL = f"http://{HOST}:{WELLNESS_PORT}"
    
    # Optional features
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    LANGUAGE = os.getenv('LANGUAGE', 'en')

# Usage in your Python files:
# from config import Config
# app.run(host=Config.HOST, port=Config.AGENT_PORT, debug=Config.DEBUG)