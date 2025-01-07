import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
import os
import base64
import google.generativeai as genai

from flask_cors import CORS 

app = Flask(__name__)
# Configure Generative AI API
api_key = "AIzaSyDY3HG8xMfPLcOSgIpiEzE029G1Govzi-4"
if not api_key:
    raise ValueError("API key not found. Set GENAI_API_KEY in the environment.")
genai.configure(api_key=api_key)

generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",
    generation_config=generation_config,
)
chat_session = model.start_chat(history=[])

# Fetch content of the given URL
def fetch_content(url):
    req = requests.get(url)
    soup = BeautifulSoup(req.content, "html.parser")
    # Remove script and style tags
    for script_or_style in soup(["script", "style"]):
        script_or_style.extract()
    return soup.get_text(strip=True)

# Summarize content with Gemini
def summarize_with_gemini(content, length):
    prompt = f"Summarize the following content to {length} length: {content[:5000]} and provide in well formated display and also underline the keywords and if needed make text in paragraphs"
    response = chat_session.send_message(prompt)
    return response.text

# Route to handle summarization requests
@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    url = data.get("url")
    length = data.get("length", "medium")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    # Fetch content of the webpage
    try:
        page_content = fetch_content(url)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch content: {e}"}), 500

    # Use Gemini for summarization
    try:
        summary = summarize_with_gemini(page_content, length)
    except Exception as e:
        return jsonify({"error": f"Failed to summarize content: {e}"}), 500

    return jsonify({"summary": summary})

@app.route("/screenshot", methods=["POST"])
def process_screenshot():
    data = request.get_json()
    image_base64 = data.get("image")

    if not image_base64:
        return jsonify({"error": "Image is required"}), 400

    try:
        # Decode the base64 image
        image_data = base64.b64decode(image_base64)

        # Send image data to Gemini for processing (fixed MIME type and data handling)
        response = model.generate_content([
            {"mime_type": "image/png", "data": image_data},
            "Describe the contents of this image."
        ])

        # Debug: Log the response
        print("Model response:", response)

        # Assuming response contains 'text' field, return it
        return jsonify({"text": response.text})
    except Exception as e:
        print("Error processing screenshot:", e)  # Log error for debugging
        return jsonify({"error": str(e)}), 500


    

if __name__ == "__main__":
    CORS(app)
    app.run(debug=True, port=8080)
