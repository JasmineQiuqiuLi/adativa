# backend/services/content_service.py

import requests
import os


def generate_anthropic_content(prompt: str) -> str:
    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": os.getenv("ANTHROPIC_API_KEY"),
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-opus-4-7",
                "max_tokens": 4000,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
            }
        )

        data = response.json()

        html = ""

        if "content" in data and len(data["content"]) > 0:
            html = data["content"][0].get("text", "")
        else:
            html = f"Error from Anthropic: {data}"

        return html

    except Exception as e:
        print("Anthropic Service Error:", e)
        return f"Exception: {str(e)}"