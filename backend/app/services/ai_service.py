import json
import logging
from typing import Optional

import requests

from app.utils.config import config

logger = logging.getLogger(__name__)

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_MODEL = "gpt-oss-120b"

_EXTRACT_SYSTEM = """\
You are a travel search assistant. Given a user's message, decide if it's asking about \
travel destinations or places to visit.

If it is NOT travel-related, respond with exactly: {"is_travel_related": false}

If it IS travel-related, respond with exactly:
{"is_travel_related": true, "keywords": ["word1", "word2"], "category": "CATEGORY_OR_NULL"}

Valid categories: food, tourist_attraction, mall, hotel, beach, nature, entertainment.
Set category to null if none fits.
keywords should be 1-5 specific descriptive terms extracted from the prompt.
Respond ONLY with valid JSON. No explanation."""

_FILTER_SYSTEM = """\
You are a travel recommendation assistant. Given a user's travel preference and candidate \
locations, pick the best matches (up to 5) ordered by relevance.

Respond ONLY with a JSON array of location IDs: ["id1", "id2"]
If none are relevant, return: []
No explanation, only JSON."""


def _call_ai(system: str, user_message: str) -> Optional[str]:
    try:
        logger.info("Calling OpenRouter API with model: %s", _MODEL)
        resp = requests.post(
            _OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {config.AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": _MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.1,
            },
            timeout=30,
        )
        logger.info("OpenRouter response status: %s", resp.status_code)
        if not resp.ok:
            logger.error("OpenRouter error response: %s", resp.text)
            return None
        raw = resp.json()["choices"][0]["message"]["content"].strip()
        logger.info("OpenRouter raw response: %s", raw)
        return raw
    except requests.exceptions.Timeout:
        logger.error("OpenRouter request timed out")
        return None
    except requests.exceptions.ConnectionError as e:
        logger.error("OpenRouter connection error: %s", e)
        return None
    except Exception as e:
        logger.error("OpenRouter unexpected error: %s", e)
        return None


def _parse_json(raw: str) -> Optional[object]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        for start_ch, end_ch in [('{', '}'), ('[', ']')]:
            s = raw.find(start_ch)
            e = raw.rfind(end_ch) + 1
            if s >= 0 and e > s:
                try:
                    return json.loads(raw[s:e])
                except json.JSONDecodeError:
                    pass
    return None


def extract_travel_intent(prompt: str) -> Optional[dict]:
    raw = _call_ai(_EXTRACT_SYSTEM, prompt)
    if not raw:
        logger.error("extract_travel_intent: AI returned no response")
        return None
    result = _parse_json(raw)
    if isinstance(result, dict):
        logger.info("extract_travel_intent result: %s", result)
        return result
    logger.error("extract_travel_intent: failed to parse JSON from raw: %s", raw)
    return None


def filter_locations_by_relevance(prompt: str, locations: list) -> list[str]:
    if not locations:
        return []

    summaries = [
        {
            "id": str(loc.id),
            "name": loc.name,
            "description": loc.description,
            "category": loc.category,
            "tags": loc.tags,
            "city": loc.city,
            "country": loc.country,
            "avg_rating": loc.avg_rating,
        }
        for loc in locations
    ]

    user_msg = (
        f'User preference: "{prompt}"\n\n'
        f"Candidate locations:\n{json.dumps(summaries, indent=2)}"
    )
    raw = _call_ai(_FILTER_SYSTEM, user_msg)

    if not raw:
        return [str(loc.id) for loc in locations[:5]]

    result = _parse_json(raw)
    if isinstance(result, list):
        return [str(i) for i in result[:5]]

    return [str(loc.id) for loc in locations[:5]]