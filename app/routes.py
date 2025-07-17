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

    print("🔹 Received message from frontend:", user_message)  # 🔍 Debug line

    if not user_message:
        return jsonify({"reply": "Please enter a valid message."})

    # 🔸 Predefined quick replies based on your buttons
    quick_prompts = {
        "Tell me a joke": "Tell me a funny joke.",
        "Today's Quote": "Share an inspirational quote.",
        "Getting Bored": "Tell me something fun or a random fact.",
        "I want Recommendation": "Give me a cool recommendation to try today."
    }

    # 🔄 If button clicked, override user message with mapped prompt
    prompt_text = quick_prompts.get(user_message, user_message)

    try:
        prompt = f"""
        Respond concisely in markdown format:
        - Use **bold** for key terms.
        - Keep it short.
        **User query:** {prompt_text}
        """
        response = model.generate_content(prompt)
        print("🔹 Gemini response:", response)  # 🔍 Debug line

        if response and response.text:
            return jsonify({"reply": response.text.strip()})
        else:
            return jsonify({"reply": "I'm sorry, I couldn't process that."})
    except Exception as e:
        print("❌ Error from Gemini:", str(e))  # 🔍 Debug line
        return jsonify({"reply": f"Error: {str(e)}"})
