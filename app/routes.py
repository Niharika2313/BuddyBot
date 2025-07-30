import time
from flask import Blueprint, render_template, request, jsonify
from app import model

main = Blueprint("main", __name__)

@main.route("/")
def index():
    return render_template("index.html")

@main.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()

    print(f"Received message from frontend: '{user_message}'")

    if not user_message:
        return jsonify({"reply": "Please enter a valid message."})

    quick_prompts = {
        "Cheer me up!": "Tell me a funny joke!",
        "What's new today?": "Give me a quick update on current events or interesting facts.",
        "Got any fun facts?": "Tell me a cool and random fun fact.",
        "Help me decide...": "I need a recommendation for something cool."
    }

    prompt_text = quick_prompts.get(user_message, user_message)

    try:
        # Measure time before the API call
        start_time = time.time()

        # Construct the prompt for Gemini
        prompt = f"""
        Respond concisely in markdown format:
        - Use **bold** for key terms.
        - Keep it short.
        User query: {prompt_text}
        """
        
        # Make the Gemini API call
        response = model.generate_content(prompt)
        
        # Measure time after the API call
        end_time = time.time()
        api_call_duration = end_time - start_time
        print(f"Gemini API call for '{prompt_text}' took: {api_call_duration:.2f} seconds")

        if response and response.text:
            return jsonify({"reply": response.text.strip()})
        else:
            print("Gemini returned an empty or invalid response.")
            return jsonify({"reply": "I'm sorry, I couldn't generate a response."})

    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        # Provide a user-friendly error message to the frontend
        return jsonify({"reply": "Sorry, I'm having trouble understanding that right now. Please try again in a moment."})