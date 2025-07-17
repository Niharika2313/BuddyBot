from flask import Flask
from flask_cors import CORS
import os
import google.generativeai as genai
from dotenv import load_dotenv


model = None

def create_app():
    load_dotenv()
    app = Flask(__name__)
    CORS(app)

    # Load Gemini API key
    api_key = os.getenv("GENAI_API_KEY")
    if not api_key:
        raise ValueError("GENAI_API_KEY not found in environment variables.")
    
    genai.configure(api_key=api_key)
    
    global model
    model = genai.GenerativeModel("gemini-1.5-flash")

    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app
