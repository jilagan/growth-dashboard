#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "httpx>=0.27",
#   "python-dotenv>=1.0",
# ]
# ///
"""
Nihongo Mentor Suite — Growth Monitor
Runs weekly, collects:
  - Reddit mentions (r/LearnJapanese, r/jlpt, r/japanlife)
  - iTunes App Store reviews (our 3 apps)
  - Competitor snapshots (WaniKani, Duolingo, Anki, Renshuu)
  - ASO keyword rankings (iTunes search)

Writes results to Supabase growth tables.
"""

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SVC_KEY = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS = {
    "apikey": SUPABASE_SVC_KEY,
    "Authorization": f"Bearer {SUPABASE_SVC_KEY}",
    "Content-Type": "application/json",
}

# ── App config ────────────────────────────────────────────────────────────────

OUR_APPS = {
    "kanji_mentor": {"id": "6760374345", "name": "Kanji Mentor"},
    "kiku_mentor":  {"id": "6761232956", "name": "Kiku Mentor"},
    "yomu_mentor":  {"id": "6761268115", "name": "Yomu Mentor"},
}

COMPETITORS = [
    {"name": "Duolingo",        "id": "570060128"},   # Duolingo
    {"name": "Anki",            "id": "373493387"},   # AnkiMobile
    {"name": "Renshuu",         "id": "1542730063"},  # renshuu
    {"name": "Kanji Study",     "id": "1078107994"},  # Kanji Study
    {"name": "Tsurukame",       "id": "1367114761"},  # Tsurukame (WaniKani client)
    {"name": "Bunpo",           "id": "1279720052"},  # Bunpo
    {"name": "Shirabe Jisho",   "id": "1005203380"},  # Jisho dictionary
]

# Keywords to track per app (app_name → list of keywords)
KEYWORDS = {
    "kanji_mentor": [
        "kanji", "kanji quiz", "kanji flashcard", "kanji app",
        "jlpt kanji", "learn kanji", "stroke order", "kanji writing",
    ],
    "kiku_mentor": [
        "japanese listening", "jlpt listening", "japanese comprehension",
        "japanese podcast", "japanese audio", "listen japanese",
    ],
    "yomu_mentor": [
        "japanese reading", "japanese graded reader", "learn japanese reading",
        "japanese comprehensible input", "yomu", "japanese reader app",
    ],
}

# Reddit search queries
REDDIT_QUERIES = [
    ("Kanji Mentor",  "kanji_mentor"),
    ("Kiku Mentor",   "kiku_mentor"),
    ("Yomu Mentor",   "yomu_mentor"),
    ("Nihongo Mentor", "suite"),
    ("archmob",        "suite"),
]

SUBREDDITS = ["LearnJapanese", "jlpt", "japanlife", "japanese"]

# ── Sentiment heuristics ──────────────────────────────────────────────────────

POSITIVE_WORDS = {
    "great", "amazing", "love", "excellent", "perfect", "awesome", "fantastic",
    "helpful", "best", "recommend", "good", "nice", "wonderful", "superb",
    "brilliant", "impressive", "useful", "effective", "improved", "better",
}
NEGATIVE_WORDS = {
    "bad", "terrible", "worst", "hate", "useless", "broken", "bug", "crash",
    "awful", "poor", "disappointing", "frustrating", "annoying", "slow",
    "expensive", "waste", "fail", "error", "problem", "issue", "fix",
}


def infer_sentiment(text: str, rating: Optional[int] = None) -> str:
    if rating is not None:
        if rating >= 4: return "positive"
        if rating == 3: return "neutral"
        return "negative"
    lower = text.lower()
    words = set(re.findall(r"\w+", lower))
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    if pos > neg: return "positive"
    if neg > pos: return "negative"
    return "neutral"


# ── Supabase helpers ──────────────────────────────────────────────────────────

def sb_insert(table: str, rows: list[dict], on_conflict: Optional[str] = None) -> int:
    """Insert rows, returning count inserted. Handles conflicts via upsert or skip."""
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    # Use upsert (merge) if conflict column specified, else plain insert
    headers = {**HEADERS, "Content-Type": "application/json"}
    if on_conflict:
        headers["Prefer"] = "resolution=ignore-duplicates,return=representation"
        params = {"on_conflict": on_conflict}
        resp = httpx.post(url, headers=headers, json=rows, params=params, timeout=30)
    else:
        headers["Prefer"] = "return=representation"
        resp = httpx.post(url, headers=headers, json=rows, timeout=30)
    if resp.status_code not in (200, 201):
        print(f"  [WARN] {table} insert {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
        return 0
    try:
        return len(resp.json())
    except Exception:
        return len(rows)


# ── Reddit ────────────────────────────────────────────────────────────────────

def collect_reddit() -> int:
    print("📱 Collecting Reddit mentions…")
    rows = []
    seen_ids: set[str] = set()
    client = httpx.Client(
        headers={"User-Agent": "GrowthMonitor/1.0 (nihongo-mentor-dashboard)"},
        follow_redirects=True,
        timeout=20,
    )

    for query, app in REDDIT_QUERIES:
        # Search globally first
        searches = [("https://www.reddit.com/search.json", {"q": query, "limit": 25, "sort": "new"})]
        # Then per subreddit
        for sub in SUBREDDITS:
            searches.append((
                f"https://www.reddit.com/r/{sub}/search.json",
                {"q": query, "limit": 15, "sort": "new", "restrict_sr": "1"},
            ))
        for url, params in searches:
            try:
                resp = client.get(url, params=params)
                if resp.status_code != 200:
                    continue
                posts = resp.json().get("data", {}).get("children", [])
                for p in posts:
                    d = p.get("data", {})
                    post_id = d.get("id", "")
                    if not post_id or post_id in seen_ids:
                        continue
                    seen_ids.add(post_id)
                    text = f"{d.get('title', '')} {d.get('selftext', '')}".strip()
                    rows.append({
                        "source": "reddit",
                        "app": app,
                        "sentiment": infer_sentiment(text),
                        "content": text[:1000],
                        "url": f"https://reddit.com{d.get('permalink', '')}",
                        "score": d.get("score"),
                        "author": d.get("author"),
                        "external_id": post_id,
                    })
                time.sleep(0.5)
            except Exception as e:
                print(f"  [WARN] reddit r/{sub} q={query!r}: {e}", file=sys.stderr)

    inserted = sb_insert("brand_mentions", rows, on_conflict="source,external_id")
    print(f"  → {inserted} new mentions ({len(rows)} fetched)")
    return inserted


# ── iTunes reviews ────────────────────────────────────────────────────────────

def collect_reviews() -> int:
    print("⭐ Collecting App Store reviews…")
    rows = []
    client = httpx.Client(follow_redirects=True, timeout=20)

    for app_key, app in OUR_APPS.items():
        for page in range(1, 4):  # up to 3 pages (300 reviews)
            url = f"https://itunes.apple.com/us/rss/customerreviews/page={page}/id={app['id']}/sortBy=mostRecent/json"
            try:
                resp = client.get(url)
                if resp.status_code != 200:
                    break
                data = resp.json()
                entries = data.get("feed", {}).get("entry", [])
                if not entries:
                    break
                # First entry is app metadata, skip it
                if isinstance(entries, list) and entries and "im:name" in entries[0]:
                    entries = entries[1:]
                for e in entries:
                    review_id = e.get("id", {}).get("label", "")
                    rating = int(e.get("im:rating", {}).get("label", 0))
                    title = e.get("title", {}).get("label", "")
                    content = e.get("content", {}).get("label", "")
                    author = e.get("author", {}).get("name", {}).get("label", "")
                    version = e.get("im:version", {}).get("label")
                    rows.append({
                        "app_name": app_key,
                        "app_id": app["id"],
                        "review_id": review_id,
                        "author": author,
                        "rating": rating,
                        "title": title,
                        "content": content[:2000],
                        "version": version,
                        "sentiment": infer_sentiment(f"{title} {content}", rating),
                    })
                time.sleep(0.3)
            except Exception as e:
                print(f"  [WARN] reviews {app_key} page={page}: {e}", file=sys.stderr)
                break

    inserted = sb_insert("app_store_reviews", rows, on_conflict="app_name,review_id")
    print(f"  → {inserted} new reviews ({len(rows)} fetched)")
    return inserted


# ── Competitor snapshots ──────────────────────────────────────────────────────

def collect_competitors() -> int:
    print("🏆 Collecting competitor snapshots…")
    rows = []
    client = httpx.Client(follow_redirects=True, timeout=20)

    # Also snapshot our own apps
    our_entries = [{"name": v["name"], "id": v["id"]} for v in OUR_APPS.values()]
    all_apps = COMPETITORS + our_entries

    for app in all_apps:
        url = f"https://itunes.apple.com/lookup?id={app['id']}&country=us"
        try:
            resp = client.get(url)
            results = resp.json().get("results", [])
            data = results[0] if results else {}
            rows.append({
                "app_name": app["name"],
                "app_id": app["id"],
                "avg_rating": data.get("averageUserRating"),
                "rating_count": data.get("userRatingCount"),
                "version": data.get("version"),
                "category_rank": None,  # not in lookup API
                "notes": None,
            })
            time.sleep(0.3)
        except Exception as e:
            print(f"  [WARN] competitor {app['name']}: {e}", file=sys.stderr)

    inserted = sb_insert("competitor_snapshots", rows)
    print(f"  → {inserted} competitor snapshots")
    return inserted


# ── ASO keyword rankings ──────────────────────────────────────────────────────

def collect_keywords() -> int:
    print("🔑 Collecting ASO keyword rankings…")
    rows = []
    client = httpx.Client(follow_redirects=True, timeout=20)

    # Get previous rankings to compute prev_rank
    prev_resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/keyword_rankings",
        headers=HEADERS,
        params={"select": "keyword,app_name,rank,captured_at", "order": "captured_at.desc", "limit": "500"},
        timeout=15,
    )
    prev_rankings: dict[str, int] = {}
    if prev_resp.status_code == 200:
        for r in prev_resp.json():
            key = f"{r['keyword']}:{r['app_name']}"
            if key not in prev_rankings and r.get("rank") is not None:
                prev_rankings[key] = r["rank"]

    for app_key, keywords in KEYWORDS.items():
        app_id = OUR_APPS[app_key]["id"]
        for kw in keywords:
            url = "https://itunes.apple.com/search"
            try:
                resp = client.get(url, params={
                    "term": kw, "country": "us", "entity": "software",
                    "limit": 50, "lang": "en_us",
                })
                results = resp.json().get("results", [])
                rank = None
                for i, r in enumerate(results, start=1):
                    if str(r.get("trackId")) == app_id:
                        rank = i
                        break
                key = f"{kw}:{app_key}"
                prev_rank = prev_rankings.get(key)

                # Estimate volume from result count (crude but free)
                total = resp.json().get("resultCount", 0)
                volume = "high" if total >= 45 else "medium" if total >= 20 else "low"

                rows.append({
                    "keyword": kw,
                    "app_name": app_key,
                    "rank": rank,
                    "prev_rank": prev_rank,
                    "search_volume_estimate": volume,
                })
                time.sleep(0.4)
            except Exception as e:
                print(f"  [WARN] keyword {kw!r} {app_key}: {e}", file=sys.stderr)

    inserted = sb_insert("keyword_rankings", rows)
    print(f"  → {inserted} keyword rankings")
    return inserted


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    start = datetime.now(timezone.utc)
    print(f"\n{'='*60}")
    print(f"Growth Monitor — {start.strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*60}\n")

    results = {}
    results["reddit"]      = collect_reddit()
    results["reviews"]     = collect_reviews()
    results["competitors"] = collect_competitors()
    results["keywords"]    = collect_keywords()

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    print(f"\n✅ Done in {elapsed:.1f}s")
    print(f"   Reddit mentions  : {results['reddit']}")
    print(f"   App Store reviews: {results['reviews']}")
    print(f"   Competitor snaps : {results['competitors']}")
    print(f"   Keyword rankings : {results['keywords']}")
    print()


if __name__ == "__main__":
    main()
