"""
Process real OULAD dataset into dashboard JSON files.
Sources: studentInfo, studentVle, studentAssessment, assessments, courses
"""
import json, os
import pandas as pd
import numpy as np
from collections import defaultdict

RAW = "oulad_raw"
OUT = "public/data"
os.makedirs(OUT, exist_ok=True)

print("Loading CSVs...")
info   = pd.read_csv(f"{RAW}/studentInfo.csv")
vle    = pd.read_csv(f"{RAW}/studentVle.csv")
sa     = pd.read_csv(f"{RAW}/studentAssessment.csv")
assess = pd.read_csv(f"{RAW}/assessments.csv")
courses= pd.read_csv(f"{RAW}/courses.csv")
reg    = pd.read_csv(f"{RAW}/studentRegistration.csv")

print(f"  studentInfo:       {len(info):,} rows")
print(f"  studentVle:        {len(vle):,} rows")
print(f"  studentAssessment: {len(sa):,} rows")

# ── VLE per-student aggregates ────────────────────────────────────────────────
print("Aggregating VLE interactions...")
vle_agg = vle.groupby(["id_student", "code_module", "code_presentation"]).agg(
    total_clicks=("sum_click", "sum"),
    days_active=("date", "nunique"),
    last_interaction=("date", "max"),
    first_interaction=("date", "min"),
).reset_index()

# ── Assessment per-student aggregates ─────────────────────────────────────────
print("Aggregating assessments...")
sa_agg = sa.groupby("id_student").agg(
    assessments_submitted=("id_assessment", "count"),
    avg_score=("score", "mean"),
    max_score=("score", "max"),
).reset_index()
sa_agg["avg_score"] = sa_agg["avg_score"].fillna(0).round(1)

# ── Merge into main student frame ─────────────────────────────────────────────
print("Merging datasets...")
df = info.merge(vle_agg, on=["id_student", "code_module", "code_presentation"], how="left")
df = df.merge(sa_agg, on="id_student", how="left")
df["total_clicks"]          = df["total_clicks"].fillna(0).astype(int)
df["days_active"]           = df["days_active"].fillna(0).astype(int)
df["assessments_submitted"] = df["assessments_submitted"].fillna(0).astype(int)
df["avg_score"]             = df["avg_score"].fillna(0)
df["last_interaction"]      = df["last_interaction"].fillna(0)

# ── Engagement score (derived from real features) ──────────────────────────────
max_clicks = df["total_clicks"].quantile(0.95)
max_days   = df["days_active"].quantile(0.95)
max_assess = df["assessments_submitted"].quantile(0.95)

df["eng_clicks"]  = (df["total_clicks"] / max_clicks).clip(0, 1) * 40
df["eng_days"]    = (df["days_active"]  / max_days  ).clip(0, 1) * 30
df["eng_assess"]  = (df["assessments_submitted"] / max_assess).clip(0, 1) * 15
df["eng_score_r"] = (df["avg_score"] / 100) * 15
df["engagement_score"] = (df["eng_clicks"] + df["eng_days"] + df["eng_assess"] + df["eng_score_r"]).round(1).clip(0, 100)

def risk(s):
    if s >= 70: return "Low"
    if s >= 50: return "Medium"
    if s >= 30: return "High"
    return "Critical"

df["risk_level"] = df["engagement_score"].apply(risk)

# map final_result to our label
outcome_map = {"Pass": "Pass", "Distinction": "Distinction", "Fail": "Fail", "Withdrawn": "Withdrawn"}
df["predicted_outcome"] = df["final_result"].map(outcome_map).fillna("Pass")

# ── OVERVIEW ──────────────────────────────────────────────────────────────────
print("Building overview.json...")
total   = len(df)
at_risk = int((df["risk_level"].isin(["High", "Critical"])).sum())
avg_eng = round(df["engagement_score"].mean(), 1)
dropout = round((df["predicted_outcome"] == "Withdrawn").sum() / total * 100, 1)
dist_r  = round((df["predicted_outcome"] == "Distinction").sum() / total * 100, 1)

bins   = [0, 20, 40, 60, 80, 100]
labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
df["score_bin"] = pd.cut(df["engagement_score"], bins=bins, labels=labels, include_lowest=True)
score_dist = df["score_bin"].value_counts().reindex(labels, fill_value=0)

overview = {
    "total_students": total,
    "at_risk_count": at_risk,
    "at_risk_pct": round(at_risk / total * 100, 1),
    "avg_engagement": avg_eng,
    "dropout_rate": dropout,
    "distinction_rate": dist_r,
    "active_modules": df["code_module"].nunique(),
    "score_distribution": [{"range": l, "count": int(c)} for l, c in score_dist.items()]
}
with open(f"{OUT}/overview.json", "w") as f: json.dump(overview, f)

# ── WEEKLY TRENDS (from real VLE dates) ───────────────────────────────────────
print("Building trends.json...")
# OULAD dates are days since course start; bucket into weeks
vle["week"] = (vle["date"] // 7) + 1
weekly = vle[vle["week"].between(1, 36)].groupby("week").agg(
    total_clicks=("sum_click", "sum"),
    active_students=("id_student", "nunique"),
).reset_index()

# merge avg score per week from studentAssessment + assessment dates
assess_with_date = assess[["id_assessment", "date"]].dropna()
sa_dated = sa.merge(assess_with_date, on="id_assessment", how="left").dropna(subset=["date"])
sa_dated["week"] = (sa_dated["date"] // 7) + 1
weekly_scores = sa_dated[sa_dated["week"].between(1, 36)].groupby("week")["score"].mean().reset_index()
weekly_scores.columns = ["week", "avg_score"]

weekly = weekly.merge(weekly_scores, on="week", how="left")
weekly["avg_score"] = weekly["avg_score"].ffill().fillna(60).round(1)

import datetime
base = datetime.date(2014, 2, 1)
weekly["date"] = weekly["week"].apply(lambda w: (base + datetime.timedelta(weeks=int(w)-1)).strftime("%b %d"))
weekly["avg_engagement"] = ((weekly["active_students"] / weekly["active_students"].max()) * 70 + 20).round(1)
weekly = weekly.rename(columns={"total_clicks": "total_clicks", "active_students": "active_students"})

trends = weekly[["week", "date", "total_clicks", "active_students", "avg_engagement", "avg_score"]].to_dict("records")
trends = [{**r, "total_clicks": int(r["total_clicks"]), "active_students": int(r["active_students"])} for r in trends]
with open(f"{OUT}/trends.json", "w") as f: json.dump(trends, f)

# ── FEATURE IMPORTANCE (computed from real correlations) ──────────────────────
print("Building features.json...")
corrs = {
    "Weekly Click Rate":          abs(df["total_clicks"].corr(df["engagement_score"])),
    "Days Active":                abs(df["days_active"].corr(df["engagement_score"])),
    "Assessment Submission Rate": abs(df["assessments_submitted"].corr(df["engagement_score"])),
    "Avg Assessment Score":       abs(df["avg_score"].corr(df["engagement_score"])),
    "Last Interaction Day":       abs(df["last_interaction"].corr(df["engagement_score"])),
}
total_corr = sum(corrs.values())
features = [
    {"feature": k, "importance": round(v / total_corr, 3), "direction": "positive" if k != "Days Since Last Login" else "negative"}
    for k, v in sorted(corrs.items(), key=lambda x: -x[1])
]
with open(f"{OUT}/features.json", "w") as f: json.dump(features, f)

# ── MODULE STATS ──────────────────────────────────────────────────────────────
print("Building modules.json...")
mod_stats = []
for mod, grp in df.groupby("code_module"):
    n = len(grp)
    mod_stats.append({
        "module": mod,
        "students": n,
        "avg_engagement": round(grp["engagement_score"].mean(), 1),
        "dropout_rate": round((grp["predicted_outcome"] == "Withdrawn").sum() / n * 100, 1),
        "pass_rate": round(grp["predicted_outcome"].isin(["Pass","Distinction"]).sum() / n * 100, 1),
        "at_risk_pct": round(grp["risk_level"].isin(["High","Critical"]).sum() / n * 100, 1),
        "avg_clicks": int(grp["total_clicks"].mean()),
    })
mod_stats.sort(key=lambda x: -x["avg_engagement"])
with open(f"{OUT}/modules.json", "w") as f: json.dump(mod_stats, f)

# ── DEMOGRAPHICS ──────────────────────────────────────────────────────────────
print("Building demographics.json...")
def grp_stats(grp_df):
    return {
        "count": len(grp_df),
        "avg_engagement": round(grp_df["engagement_score"].mean(), 1),
        "at_risk_pct": round(grp_df["risk_level"].isin(["High","Critical"]).sum() / len(grp_df) * 100, 1)
    }

by_age = [{"label": age, **grp_stats(g)} for age, g in df.groupby("age_band")]
by_region = [{"label": r, **grp_stats(g)} for r, g in df.groupby("region")]
by_edu = [{"label": e, **grp_stats(g)} for e, g in df.groupby("highest_education")]
by_outcome = [{"label": o, "count": int((df["predicted_outcome"] == o).sum())}
              for o in ["Pass", "Distinction", "Fail", "Withdrawn"]]

demographics = {"by_age": by_age, "by_region": by_region, "by_education": by_edu, "by_outcome": by_outcome}
with open(f"{OUT}/demographics.json", "w") as f: json.dump(demographics, f)

# ── AT-RISK TABLE (real worst 50) ─────────────────────────────────────────────
print("Building at_risk.json...")
at_risk_df = df[df["risk_level"].isin(["High","Critical"])].nsmallest(50, "engagement_score")
at_risk_records = []
for _, r in at_risk_df.iterrows():
    at_risk_records.append({
        "id": f"S{int(r['id_student'])}",
        "module": r["code_module"],
        "engagement_score": r["engagement_score"],
        "days_active": int(r["days_active"]),
        "assessments_submitted": int(r["assessments_submitted"]),
        "risk_level": r["risk_level"],
        "predicted_outcome": r["predicted_outcome"],
        "avg_score": round(r["avg_score"], 1),
    })
with open(f"{OUT}/at_risk.json", "w") as f: json.dump(at_risk_records, f)

# ── SEGMENTATION (sample 500 for scatter) ─────────────────────────────────────
print("Building segments.json...")
sample = df.sample(min(500, len(df)), random_state=42)
segments = []
for _, r in sample.iterrows():
    # normalize to 0-100 axes for scatter
    x = min(100, (r["total_clicks"] / max_clicks) * 100)
    y = r["engagement_score"]
    segments.append({
        "x": round(float(x), 2),
        "y": round(float(y), 2),
        "engagement_score": r["engagement_score"],
        "risk_level": r["risk_level"],
        "module": r["code_module"],
        "predicted_outcome": r["predicted_outcome"],
    })
with open(f"{OUT}/segments.json", "w") as f: json.dump(segments, f)

print("\nDone!")
print(f"  Total students:   {total:,}")
print(f"  At-risk:          {at_risk:,} ({overview['at_risk_pct']}%)")
print(f"  Avg engagement:   {avg_eng}")
print(f"  Dropout rate:     {dropout}%")
print(f"  Distinction rate: {dist_r}%")
print(f"  Modules:          {overview['active_modules']}")
print(f"  VLE weeks:        {len(trends)}")
