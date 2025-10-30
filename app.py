import os, sys, argparse, json
from dotenv import load_dotenv
from openai import OpenAI
from flask import Flask, render_template, request, jsonify

# ---------------- ENVIRONMENT ----------------
load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = (
    "You are Apollo, an AI songwriting coach and creative partner. "
    "Always respond ONLY with valid JSON in this exact structure:\n"
    "{\n"
    "  \"summary\": \"...\",\n"
    "  \"creative\": [\n"
    "    { \"label\": \"Imagery\", \"text\": \"...\" },\n"
    "    { \"label\": \"Emotion\", \"text\": \"...\" }\n"
    "  ],\n"
    "  \"critical\": [\n"
    "    { \"label\": \"Clarity\", \"text\": \"...\" },\n"
    "    { \"label\": \"Repetition\", \"text\": \"...\" }\n"
    "  ],\n"
    "  \"lineByLine\": [\n"
    "    { \"orig\": \"...\", \"creative\": \"...\", \"critical\": \"...\" }\n"
    "  ],\n"
    "  \"metrics\": { \"Words\": 0, \"Unique words\": 0 }\n"
    "}\n"
    "Do not include any extra commentary, explanations, or text outside the JSON."
)

if not API_KEY:
    print("❌ Missing OPENAI_API_KEY in .env")
    sys.exit(1)

client = OpenAI(api_key=API_KEY)

# ---------------- CHAT COMPLETION ----------------
def chat_completion(messages):
    resp = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.9,
    )
    return resp.choices[0].message.content.strip()

# ---------------- FLASK APP ----------------
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    lyrics = data.get("lyrics", "")
    section = data.get("section", "Verse")
    mood = data.get("mood", "Heartbreak")
    genre = data.get("genre", "Pop")
    tone = data.get("tone", 50)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Lyrics:\n{lyrics}\n\nSection: {section}\nMood: {mood}\nGenre: {genre}\nTone: {tone}"}
    ]

    try:
        reply = chat_completion(messages)

        # Try to parse the reply as JSON
        try:
            parsed = json.loads(reply)
        except Exception:
            # Fallback: wrap raw text in minimal JSON so frontend never breaks
            parsed = {
                "summary": reply,
                "creative": [],
                "critical": [],
                "lineByLine": [],
                "metrics": {}
            }

        return jsonify({"analysis": parsed})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- MAIN ----------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--web", action="store_true", help="Run Apollo as Flask web app")
    args = parser.parse_args()

    if args.web:
        app.run(debug=True)
    else:
        print("Run with --web to start the Flask app.")