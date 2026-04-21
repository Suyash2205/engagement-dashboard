import json, random, math
from datetime import datetime, timedelta

random.seed(42)

MODULES = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]
PRESENTATIONS = ["2013B", "2014B", "2014J", "2013J"]
AGE_BANDS = ["0-35", "35-55", "55<="]
REGIONS = ["London", "Yorkshire", "Scotland", "Wales", "South East", "North West", "East Midlands"]
EDUCATION = ["HE Qualification", "A Level", "Lower Than A Level", "Post Graduate"]
OUTCOMES = ["Pass", "Distinction", "Fail", "Withdrawn"]
ACTIVITY_TYPES = ["forumng", "homepage", "oucontent", "quiz", "resource", "subpage", "url", "ouwiki"]

def engagement_score(clicks, days_active, assessments_submitted, avg_score):
    raw = (clicks / 200) * 40 + (days_active / 270) * 25 + (assessments_submitted / 7) * 20 + (avg_score / 100) * 15
    return round(min(100, max(0, raw + random.gauss(0, 3))), 1)

def risk_level(score):
    if score >= 70: return "Low"
    if score >= 50: return "Medium"
    if score >= 30: return "High"
    return "Critical"

def predict_outcome(score):
    r = random.random()
    if score >= 70:
        outcomes = [("Pass", 0.45), ("Distinction", 0.50), ("Fail", 0.03), ("Withdrawn", 0.02)]
    elif score >= 50:
        outcomes = [("Pass", 0.60), ("Distinction", 0.10), ("Fail", 0.20), ("Withdrawn", 0.10)]
    elif score >= 30:
        outcomes = [("Pass", 0.30), ("Distinction", 0.02), ("Fail", 0.40), ("Withdrawn", 0.28)]
    else:
        outcomes = [("Pass", 0.10), ("Distinction", 0.00), ("Fail", 0.35), ("Withdrawn", 0.55)]
    cumulative = 0
    for outcome, prob in outcomes:
        cumulative += prob
        if r <= cumulative:
            return outcome
    return "Pass"

# ── Students ──────────────────────────────────────────────────────────────────
N = 1200
students = []
for i in range(N):
    module = random.choice(MODULES)
    age = random.choice(AGE_BANDS)
    region = random.choice(REGIONS)
    education = random.choice(EDUCATION)
    clicks = int(random.lognormvariate(4.5, 1.2))
    days_active = random.randint(5, 270)
    assessments = random.randint(0, 7)
    avg_score = round(random.gauss(62, 22), 1)
    avg_score = max(0, min(100, avg_score))
    score = engagement_score(clicks, days_active, assessments, avg_score)
    risk = risk_level(score)
    outcome = predict_outcome(score)
    students.append({
        "id": f"S{10000 + i}",
        "module": module,
        "presentation": random.choice(PRESENTATIONS),
        "age_band": age,
        "region": region,
        "education": education,
        "clicks": clicks,
        "days_active": days_active,
        "assessments_submitted": assessments,
        "avg_score": avg_score,
        "engagement_score": score,
        "risk_level": risk,
        "predicted_outcome": outcome,
        "disability": random.random() < 0.08
    })

# ── Overview KPIs ─────────────────────────────────────────────────────────────
total = len(students)
at_risk = sum(1 for s in students if s["risk_level"] in ["High", "Critical"])
avg_eng = round(sum(s["engagement_score"] for s in students) / total, 1)
dropout_rate = round(sum(1 for s in students if s["predicted_outcome"] == "Withdrawn") / total * 100, 1)
distinction_rate = round(sum(1 for s in students if s["predicted_outcome"] == "Distinction") / total * 100, 1)

overview = {
    "total_students": total,
    "at_risk_count": at_risk,
    "at_risk_pct": round(at_risk / total * 100, 1),
    "avg_engagement": avg_eng,
    "dropout_rate": dropout_rate,
    "distinction_rate": distinction_rate,
    "active_modules": len(MODULES),
    "score_distribution": [
        {"range": "0-20", "count": sum(1 for s in students if s["engagement_score"] < 20)},
        {"range": "20-40", "count": sum(1 for s in students if 20 <= s["engagement_score"] < 40)},
        {"range": "40-60", "count": sum(1 for s in students if 40 <= s["engagement_score"] < 60)},
        {"range": "60-80", "count": sum(1 for s in students if 60 <= s["engagement_score"] < 80)},
        {"range": "80-100", "count": sum(1 for s in students if s["engagement_score"] >= 80)},
    ]
}

# ── Weekly Trends (36 weeks) ──────────────────────────────────────────────────
base_date = datetime(2024, 1, 15)
trends = []
base_clicks = 18000
base_active = 780
for week in range(36):
    # semester pattern: ramp up, plateau, dip, finals spike
    t = week / 35
    semester_factor = math.sin(t * math.pi) * 0.4 + 0.8
    if week in [6, 7, 18, 19]:  # mid-terms / holidays
        semester_factor *= 0.65
    if week in [30, 31, 32]:  # finals
        semester_factor *= 1.3
    noise = random.gauss(1, 0.05)
    clicks = int(base_clicks * semester_factor * noise)
    active = int(base_active * semester_factor * noise * 0.9)
    avg_score_week = round(55 + 20 * math.sin(t * math.pi * 0.8) + random.gauss(0, 3), 1)
    trends.append({
        "week": week + 1,
        "date": (base_date + timedelta(weeks=week)).strftime("%b %d"),
        "total_clicks": clicks,
        "active_students": active,
        "avg_engagement": round(40 + 35 * semester_factor * noise, 1),
        "avg_score": max(0, min(100, avg_score_week)),
        "new_enrollments": random.randint(0, 25) if week < 4 else 0
    })

# ── Feature Importance ────────────────────────────────────────────────────────
features = [
    {"feature": "Weekly Click Rate", "importance": 0.31, "direction": "positive"},
    {"feature": "Days Since Last Login", "importance": 0.22, "direction": "negative"},
    {"feature": "Assessment Submission Rate", "importance": 0.18, "direction": "positive"},
    {"feature": "Forum Participation", "importance": 0.12, "direction": "positive"},
    {"feature": "Avg Assessment Score", "importance": 0.09, "direction": "positive"},
    {"feature": "Resource Access Rate", "importance": 0.05, "direction": "positive"},
    {"feature": "Video Watch Completion", "importance": 0.03, "direction": "positive"},
]

# ── Module Stats ──────────────────────────────────────────────────────────────
module_stats = []
for mod in MODULES:
    mod_students = [s for s in students if s["module"] == mod]
    if not mod_students:
        continue
    n = len(mod_students)
    module_stats.append({
        "module": mod,
        "students": n,
        "avg_engagement": round(sum(s["engagement_score"] for s in mod_students) / n, 1),
        "dropout_rate": round(sum(1 for s in mod_students if s["predicted_outcome"] == "Withdrawn") / n * 100, 1),
        "pass_rate": round(sum(1 for s in mod_students if s["predicted_outcome"] in ["Pass", "Distinction"]) / n * 100, 1),
        "at_risk_pct": round(sum(1 for s in mod_students if s["risk_level"] in ["High", "Critical"]) / n * 100, 1),
        "avg_clicks": round(sum(s["clicks"] for s in mod_students) / n),
    })

# ── Demographics ──────────────────────────────────────────────────────────────
demographics = {
    "by_age": [],
    "by_region": [],
    "by_education": [],
    "by_outcome": []
}
for band in AGE_BANDS:
    grp = [s for s in students if s["age_band"] == band]
    demographics["by_age"].append({
        "label": band,
        "count": len(grp),
        "avg_engagement": round(sum(s["engagement_score"] for s in grp) / len(grp), 1) if grp else 0,
        "at_risk_pct": round(sum(1 for s in grp if s["risk_level"] in ["High", "Critical"]) / len(grp) * 100, 1) if grp else 0
    })
for region in REGIONS:
    grp = [s for s in students if s["region"] == region]
    demographics["by_region"].append({
        "label": region,
        "count": len(grp),
        "avg_engagement": round(sum(s["engagement_score"] for s in grp) / len(grp), 1) if grp else 0,
    })
for edu in EDUCATION:
    grp = [s for s in students if s["education"] == edu]
    demographics["by_education"].append({
        "label": edu,
        "count": len(grp),
        "avg_engagement": round(sum(s["engagement_score"] for s in grp) / len(grp), 1) if grp else 0,
    })
for outcome in OUTCOMES:
    demographics["by_outcome"].append({
        "label": outcome,
        "count": sum(1 for s in students if s["predicted_outcome"] == outcome)
    })

# ── At-Risk Students (top 50 most critical) ───────────────────────────────────
at_risk_students = sorted(
    [s for s in students if s["risk_level"] in ["High", "Critical"]],
    key=lambda x: x["engagement_score"]
)[:50]

# ── Segmentation clusters (for scatter) ──────────────────────────────────────
segments = []
for s in students:
    # simulate t-SNE-like 2D projection based on features
    x = (s["clicks"] / 500) * 60 + random.gauss(0, 8)
    y = (s["engagement_score"] / 100) * 60 + random.gauss(0, 8)
    segments.append({
        "x": round(x, 2),
        "y": round(y, 2),
        "engagement_score": s["engagement_score"],
        "risk_level": s["risk_level"],
        "module": s["module"],
        "predicted_outcome": s["predicted_outcome"]
    })

# ── Write JSON files ──────────────────────────────────────────────────────────
output = {
    "public/data/overview.json": overview,
    "public/data/trends.json": trends,
    "public/data/features.json": features,
    "public/data/modules.json": module_stats,
    "public/data/demographics.json": demographics,
    "public/data/at_risk.json": at_risk_students,
    "public/data/segments.json": segments[:400],  # limit for perf
}

import os
os.makedirs("public/data", exist_ok=True)
for path, data in output.items():
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✓ {path}")

print(f"\nDataset: {N} students | {len(at_risk_students)} at-risk | avg engagement {avg_eng}")
