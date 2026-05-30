import logging
import os
import re
from typing import Any
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv


logger = logging.getLogger(__name__)
load_dotenv()

TAVILY_SEARCH_URL = "https://api.tavily.com/search"
IMAGE_LAYOUTS = {"image_top", "image_left", "image_right", "hero"}
REQUEST_TIMEOUT_SECONDS = 6
TAVILY_TIMEOUT_SECONDS = (5, 18)
MAX_QUERY_CHARS = 220


def enrich_rich_content_images(
    blocks: list[dict[str, Any]],
    objective: dict[str, Any],
    skills: list[str],
) -> list[dict[str, Any]]:
    """Replace generated rich-content image URLs with verified Tavily images.

    Image enrichment is best-effort. If Tavily is unavailable or no candidate
    image can be verified, image-layout rich content falls back to text-only.
    """
    tavily_api_key = os.getenv("TAVILY_API_KEY")

    for block in blocks:
        if block.get("type") != "rich_content":
            continue

        layout = block.get("layout") or "text"
        block["image_url"] = None

        if layout not in IMAGE_LAYOUTS:
            continue

        if not tavily_api_key:
            _fallback_to_text(block, "TAVILY_API_KEY is not configured")
            continue

        query = _build_image_query(block, objective, skills)
        if not query:
            _fallback_to_text(block, "no useful search query could be built")
            continue

        image = _search_tavily_image(
            api_key=tavily_api_key,
            query=query,
            fallback_query=_build_topic_fallback_query(objective, skills),
        )

        if not image:
            _fallback_to_text(block, "Tavily returned no verified image")
            continue

        block["image_url"] = image["url"]
        block["image_alt"] = (
            image.get("description")
            or block.get("image_alt")
            or block.get("headline")
            or f"Illustration for {objective.get('title', 'this lesson')}"
        )

        if image.get("description") and not block.get("caption"):
            block["caption"] = image["description"]

    return blocks


def _fallback_to_text(block: dict[str, Any], reason: str) -> None:
    logger.info(
        "Rich content image enrichment fell back to text layout: %s",
        reason,
    )
    block["image_url"] = None
    block["layout"] = "text"


def _build_image_query(
    block: dict[str, Any],
    objective: dict[str, Any],
    skills: list[str],
) -> str:
    headline = _clean_search_text(block.get("headline"), limit=80)
    body = _clean_search_text(block.get("body"), limit=90)
    caption = _clean_search_text(block.get("caption"), limit=70)
    objective_title = _clean_search_text(objective.get("title"), limit=70)
    skills_text = _clean_search_text(", ".join(skills[:3]) if skills else None, limit=80)

    subject = headline or caption or body or objective_title
    context = " ".join(
        piece
        for piece in [objective_title, skills_text]
        if piece and piece != subject
    )
    text = " ".join(piece for piece in [subject, context] if piece)

    if not text:
        return ""

    return f"educational illustration {text}"[:MAX_QUERY_CHARS]


def _build_topic_fallback_query(
    objective: dict[str, Any],
    skills: list[str],
) -> str:
    pieces = (
        _clean_search_text(objective.get("title"), limit=80),
        _clean_search_text(objective.get("description"), limit=90),
        _clean_search_text(", ".join(skills[:3]) if skills else None, limit=80),
    )
    text = " ".join(piece for piece in pieces if piece)

    if not text:
        return ""

    return f"educational topic illustration {text}"[:MAX_QUERY_CHARS]


def _clean_search_text(value: Any, limit: int) -> str:
    if not value:
        return ""

    text = str(value)
    text = re.sub(r"`{1,3}.*?`{1,3}", " ", text)
    text = re.sub(r"\|+", " ", text)
    text = re.sub(r"\*\*|__|#{1,6}|[-*_]{3,}", " ", text)
    text = re.sub(r"\[[^\]]+\]\([^)]+\)", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text[:limit].strip()


def _search_tavily_image(
    api_key: str,
    query: str,
    fallback_query: str | None = None,
) -> dict[str, str] | None:
    image = _search_tavily_image_once(
        api_key=api_key,
        query=query,
        query_kind="specific",
    )
    if image:
        return image

    if fallback_query and fallback_query != query:
        return _search_tavily_image_once(
            api_key=api_key,
            query=fallback_query,
            query_kind="topic",
        )

    return None


def _search_tavily_image_once(
    api_key: str,
    query: str,
    query_kind: str,
) -> dict[str, str] | None:
    request_body = {
        "query": query,
        "search_depth": "basic",
        "include_images": True,
        "include_image_descriptions": True,
        "include_answer": False,
        "include_raw_content": False,
        "max_results": 3,
    }

    logger.info(
        "Tavily rich-content image request (%s): %s",
        query_kind,
        request_body,
    )

    try:
        response = requests.post(
            TAVILY_SEARCH_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=request_body,
            timeout=TAVILY_TIMEOUT_SECONDS,
        )
        logger.info(
            "Tavily rich-content image response (%s): status=%s body=%s",
            query_kind,
            response.status_code,
            response.text[:2000],
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.warning(
            "Tavily image search failed for %s query: %s",
            query_kind,
            exc,
        )
        return None

    try:
        payload = response.json()
    except ValueError:
        logger.exception("Tavily image search returned invalid JSON")
        return None

    candidates = _iter_image_candidates(payload)
    logger.info(
        "Tavily rich-content image candidates (%s): top_level_images=%s results=%s candidates=%s",
        query_kind,
        len(payload.get("images") or []),
        len(payload.get("results") or []),
        len(candidates),
    )

    for idx, image in enumerate(candidates, start=1):
        url = image.get("url")
        description = image.get("description") or ""
        if not url:
            logger.info(
                "Tavily image candidate rejected (%s #%s): missing url",
                query_kind,
                idx,
            )
            continue

        validation_error = _get_image_validation_error(url)
        if not validation_error:
            logger.info(
                "Tavily image candidate accepted (%s #%s): url=%s description=%s",
                query_kind,
                idx,
                url,
                description[:240],
            )
            return image

        logger.info(
            "Tavily image candidate rejected (%s #%s): url=%s reason=%s description=%s",
            query_kind,
            idx,
            url,
            validation_error,
            description[:240],
        )

    return None


def _iter_image_candidates(payload: dict[str, Any]) -> list[dict[str, str]]:
    candidates: list[dict[str, str]] = []

    def add_image(value: Any) -> None:
        if isinstance(value, str):
            candidates.append({"url": value})
        elif isinstance(value, dict) and value.get("url"):
            candidates.append({
                "url": str(value["url"]),
                "description": str(value.get("description") or ""),
            })

    for image in payload.get("images") or []:
        add_image(image)

    for result in payload.get("results") or []:
        if not isinstance(result, dict):
            continue
        for image in result.get("images") or []:
            add_image(image)

    return candidates


def _is_verified_image_url(url: str) -> bool:
    return _get_image_validation_error(url) is None


def _get_image_validation_error(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return f"unsupported URL scheme: {parsed.scheme or 'missing'}"

    try:
        response = requests.head(
            url,
            allow_redirects=True,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        return _get_image_validation_error_with_get(
            url,
            f"HEAD request failed: {exc}",
        )

    if response.status_code >= 400:
        return _get_image_validation_error_with_get(
            url,
            f"HEAD returned status {response.status_code}",
        )

    if not _has_image_content_type(response):
        return (
            "HEAD content-type was not image: "
            f"{response.headers.get('content-type', '')}"
        )

    return None


def _is_verified_image_url_with_get(url: str) -> bool:
    return _get_image_validation_error_with_get(url) is None


def _get_image_validation_error_with_get(
    url: str,
    previous_error: str | None = None,
) -> str | None:
    try:
        response = requests.get(
            url,
            allow_redirects=True,
            stream=True,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        if previous_error:
            return f"{previous_error}; GET request failed: {exc}"
        return f"GET request failed: {exc}"

    try:
        if response.status_code >= 400:
            if previous_error:
                return f"{previous_error}; GET returned status {response.status_code}"
            return f"GET returned status {response.status_code}"

        if not _has_image_content_type(response):
            content_type = response.headers.get("content-type", "")
            if previous_error:
                return (
                    f"{previous_error}; GET content-type was not image: "
                    f"{content_type}"
                )
            return f"GET content-type was not image: {content_type}"

        return None
    finally:
        response.close()


def _has_image_content_type(response: requests.Response) -> bool:
    content_type = response.headers.get("content-type", "").lower()
    if not content_type:
        return True
    return content_type.startswith("image/")
