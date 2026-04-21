"""
Real AI pipeline for the Engagement Dashboard.
Trains a RandomForestClassifier on OULAD data, computes genuine metrics,
and regenerates all public/data/*.json files using model predictions.

Run: python train_model.py
"""
import json, os, datetime
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

RAW = "oulad_raw"
OUT = "public/data"
os.makedirs(OUT, exist_ok=True)

# ── Load raw CSVs ─────────────────────────────────────────────────────────────
print("Loading CSVs...")
info   = pd.read_csv(f"{RAW}/studentInfo.csv")
vle    = pd.read_csv(f"{RAW}/studentVle.csv")
sa     = pd.read_csv(f"{RAW}/studentAssessment.csv")
assess = pd.read_csv(f"{RAW}/assessments.csv")
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
sa_agg["max_score"] = sa_agg["max_score"].fillna(0)

# ── Merge into main frame ─────────────────────────────────────────────────────
print("Merging datasets...")
df = info.merge(vle_agg, on=["id_student", "code_module", "code_presentation"], how="left")
df = df.merge(sa_agg, on="id_student", how="left")
df["total_clicks"]          = df["total_clicks"].fillna(0).astype(int)
df["days_active"]           = df["days_active"].fillna(0).astype(int)
df["assessments_submitted"] = df["assessments_submitted"].fillna(0).astype(int)
df["avg_score"]             = df["avg_score"].fillna(0)
df["max_score"]             = df["max_score"].fillna(0)
df["last_interaction"]      = df["last_interaction"].fillna(0)
df["first_interaction"]     = df["first_interaction"].fillna(0)
df["num_of_prev_attempts"]  = df["num_of_prev_attempts"].fillna(0).astype(int)
df["studied_credits"]       = df["studied_credits"].fillna(0).astype(int)

# ── Encode categorical features ───────────────────────────────────────────────
print("Encoding features...")
age_order = {"0-35": 0, "35-55": 1, "55<=": 2}
edu_order = {
    "No Formal quals": 0,
    "Lower Than A Level": 1,
    "A Level or Equivalent": 2,
    "HE Qualification": 3,
    "Post Graduate Qualification": 4,
}
df["age_encoded"]      = df["age_band"].map(age_order).fillna(1).astype(int)
df["edu_encoded"]      = df["highest_education"].map(edu_order).fillna(2).astype(int)
df["disability_enc"]   = (df["disability"] == "Y").astype(int)
df["gender_enc"]       = (df["gender"] == "M").astype(int)

# imd_band: socioeconomic band — convert to numeric (0-100)
def parse_imd(band):
    try:
        return float(str(band).split("-")[0])
    except Exception:
        return 50.0
df["imd_numeric"] = df["imd_band"].apply(parse_imd)

# ── Feature matrix ────────────────────────────────────────────────────────────
FEATURE_NAMES = [
    "total_clicks",
    "days_active",
    "assessments_submitted",
    "avg_score",
    "last_interaction",
    "first_interaction",
    "num_of_prev_attempts",
    "studied_credits",
    "age_encoded",
    "edu_encoded",
    "disability_enc",
    "gender_enc",
    "imd_numeric",
]
FEATURE_DISPLAY = [
    "Weekly Click Rate",
    "Days Active",
    "Assessment Submission Rate",
    "Avg Assessment Score",
    "Last Interaction Day",
    "First Interaction Day",
    "Previous Attempts",
    "Studied Credits",
    "Age Group",
    "Education Level",
    "Disability",
    "Gender",
    "Socioeconomic Band (IMD)",
]

X = df[FEATURE_NAMES].values
y = df["final_result"].values  # Pass, Distinction, Fail, Withdrawn

# ── Train / test split ────────────────────────────────────────────────────────
print("Splitting data (80/20 stratified)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

# ── Train Random Forest ───────────────────────────────────────────────────────
print("Training RandomForestClassifier (200 estimators, max_depth=12)...")
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
rf.fit(X_train, y_train)
print("  Training complete.")

# ── Evaluate on test set ──────────────────────────────────────────────────────
print("Evaluating model...")
y_pred  = rf.predict(X_test)
y_proba = rf.predict_proba(X_test)

accuracy  = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
recall    = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1        = f1_score(y_test, y_pred, average="weighted", zero_division=0)

# AUC-ROC multiclass OvR
y_test_dummies = pd.get_dummies(y_test).reindex(columns=rf.classes_, fill_value=0)
auc_roc = roc_auc_score(y_test_dummies, y_proba, average="weighted", multi_class="ovr")

# Specificity: per-class true negative rate, then weighted mean
cm = confusion_matrix(y_test, y_pred, labels=rf.classes_)
specificity_scores = []
for i in range(len(rf.classes_)):
    tp = cm[i, i]
    fn = cm[i, :].sum() - tp
    fp = cm[:, i].sum() - tp
    tn = cm.sum() - tp - fn - fp
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    specificity_scores.append(spec)
specificity = float(np.mean(specificity_scores))

print(f"  Accuracy:    {accuracy:.3f}")
print(f"  Precision:   {precision:.3f}")
print(f"  Recall:      {recall:.3f}")
print(f"  F1 (wtd):    {f1:.3f}")
print(f"  AUC-ROC:     {auc_roc:.3f}")
print(f"  Specificity: {specificity:.3f}")

# ── Baseline models (for honest comparison) ───────────────────────────────────
print("\nTraining baseline models for comparison...")

def evaluate_model(model, name, needs_scaling=False):
    """Fit on X_train, score on X_test — return metrics dict."""
    steps = [("imputer", SimpleImputer(strategy="median"))]
    if needs_scaling:
        steps.append(("scaler", StandardScaler()))
    steps.append(("clf", model))
    pipe = Pipeline(steps)
    pipe.fit(X_train, y_train)
    preds  = pipe.predict(X_test)
    probas = pipe.predict_proba(X_test)

    acc  = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, average="weighted", zero_division=0)
    rec  = recall_score(y_test, preds, average="weighted", zero_division=0)
    f1_  = f1_score(y_test, preds, average="weighted", zero_division=0)
    cls  = pipe.classes_
    y_test_d = pd.get_dummies(y_test).reindex(columns=cls, fill_value=0)
    try:
        auc = roc_auc_score(y_test_d, probas, average="weighted", multi_class="ovr")
    except Exception:
        auc = 0.0
    print(f"  {name:22s} acc={acc:.3f}  f1={f1_:.3f}  auc={auc:.3f}")
    return {
        "name":      name,
        "accuracy":  round(acc  * 100, 1),
        "precision": round(prec * 100, 1),
        "recall":    round(rec  * 100, 1),
        "f1_score":  round(f1_  * 100, 1),
        "auc_roc":   round(auc  * 100, 1),
    }

baselines = [
    evaluate_model(
        LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
        "Logistic Regression",
        needs_scaling=True,
    ),
    evaluate_model(
        GradientBoostingClassifier(n_estimators=150, max_depth=4, random_state=42),
        "Gradient Boosting",
    ),
]
baselines.append({
    "name":      "Random Forest (selected)",
    "accuracy":  round(accuracy  * 100, 1),
    "precision": round(precision * 100, 1),
    "recall":    round(recall    * 100, 1),
    "f1_score":  round(f1        * 100, 1),
    "auc_roc":   round(auc_roc   * 100, 1),
})

# ── Feature importance (from trained model) ───────────────────────────────────
importances = rf.feature_importances_

# Direction: correlation of each feature with probability of positive outcome
all_proba_full = rf.predict_proba(X)
classes = list(rf.classes_)
pos_idx = [i for i, c in enumerate(classes) if c in ("Pass", "Distinction")]
positive_proba = all_proba_full[:, pos_idx].sum(axis=1)

directions = []
for feat in FEATURE_NAMES:
    corr = float(pd.Series(df[feat].values).corr(pd.Series(positive_proba)))
    directions.append("positive" if corr >= 0 else "negative")

features_data = sorted(
    zip(FEATURE_DISPLAY, importances, directions),
    key=lambda x: -x[1]
)
features_json = [
    {"feature": name, "importance": round(float(imp), 4), "direction": d}
    for name, imp, d in features_data
]

# ── Model metrics JSON ────────────────────────────────────────────────────────
model_metrics = {
    "algorithm": "Random Forest",
    "n_estimators": 200,
    "max_depth": 12,
    "train_size": int(len(X_train)),
    "test_size": int(len(X_test)),
    "accuracy":    round(accuracy    * 100, 1),
    "precision":   round(precision   * 100, 1),
    "recall":      round(recall      * 100, 1),
    "f1_score":    round(f1          * 100, 1),
    "auc_roc":     round(auc_roc     * 100, 1),
    "specificity": round(specificity * 100, 1),
    "classes": classes,
    "trained_on": datetime.date.today().isoformat(),
    "baselines": baselines,
    "confusion_matrix": {
        "labels": list(rf.classes_),
        "matrix": cm.tolist(),
    },
}

with open(f"{OUT}/model_metrics.json", "w") as f:
    json.dump(model_metrics, f, indent=2)
print(f"[OK] model_metrics.json")

with open(f"{OUT}/features.json", "w") as f:
    json.dump(features_json, f, indent=2)
print(f"[OK] features.json")

# ── Predict on entire dataset ─────────────────────────────────────────────────
print("Predicting on full dataset...")
all_proba  = rf.predict_proba(X)
all_pred   = rf.predict(X)

df["predicted_outcome"] = all_pred

# Risk level from model's predicted probability of Fail or Withdrawn
fail_idx      = classes.index("Fail")      if "Fail"      in classes else -1
withdrawn_idx = classes.index("Withdrawn") if "Withdrawn" in classes else -1

if fail_idx >= 0 and withdrawn_idx >= 0:
    df["risk_proba"] = all_proba[:, fail_idx] + all_proba[:, withdrawn_idx]
elif fail_idx >= 0:
    df["risk_proba"] = all_proba[:, fail_idx]
else:
    df["risk_proba"] = 0.5

def risk_from_proba(p):
    if p < 0.25: return "Low"
    if p < 0.45: return "Medium"
    if p < 0.65: return "High"
    return "Critical"

df["risk_level"] = df["risk_proba"].apply(risk_from_proba)

# ── Engagement score (rule-based, unchanged) ──────────────────────────────────
max_clicks = max(float(df["total_clicks"].quantile(0.95)), 1.0)
max_days   = max(float(df["days_active"].quantile(0.95)), 1.0)
max_assess = max(float(df["assessments_submitted"].quantile(0.95)), 1.0)

df["engagement_score"] = (
    (df["total_clicks"]          / max_clicks).clip(0, 1) * 40 +
    (df["days_active"]           / max_days  ).clip(0, 1) * 30 +
    (df["assessments_submitted"] / max_assess).clip(0, 1) * 15 +
    (df["avg_score"]             / 100)                   * 15
).round(1).clip(0, 100)

# ── OVERVIEW ──────────────────────────────────────────────────────────────────
print("Building overview.json...")
total   = len(df)
at_risk = int(df["risk_level"].isin(["High", "Critical"]).sum())
avg_eng = round(float(df["engagement_score"].mean()), 1)
dropout = round((df["predicted_outcome"] == "Withdrawn").sum() / total * 100, 1)
dist_r  = round((df["predicted_outcome"] == "Distinction").sum() / total * 100, 1)

bins   = [0, 20, 40, 60, 80, 100]
labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
df["score_bin"] = pd.cut(df["engagement_score"], bins=bins, labels=labels, include_lowest=True)
score_dist = df["score_bin"].value_counts().reindex(labels, fill_value=0)

overview = {
    "total_students": total,
    "at_risk_count":  at_risk,
    "at_risk_pct":    round(at_risk / total * 100, 1),
    "avg_engagement": avg_eng,
    "dropout_rate":   dropout,
    "distinction_rate": dist_r,
    "active_modules": int(df["code_module"].nunique()),
    "model_accuracy": model_metrics["accuracy"],
    "score_distribution": [{"range": l, "count": int(c)} for l, c in score_dist.items()],
}
with open(f"{OUT}/overview.json", "w") as f:
    json.dump(overview, f)
print(f"[OK] overview.json")

# ── WEEKLY TRENDS ─────────────────────────────────────────────────────────────
print("Building trends.json...")
vle["week"] = (vle["date"] // 7) + 1
vle_weekly = vle[vle["week"].between(1, 36)]
weekly_clicks = vle_weekly.groupby("week", as_index=False)["sum_click"].sum()
weekly_clicks.columns = ["week", "total_clicks"]
weekly_active = (
    vle_weekly[["week", "id_student"]]
    .drop_duplicates()
    .groupby("week", as_index=False)
    .size()
    .rename(columns={"size": "active_students"})
)
weekly = weekly_clicks.merge(weekly_active, on="week", how="left")

assess_with_date = assess[["id_assessment", "date"]].dropna()
sa_dated = sa.merge(assess_with_date, on="id_assessment", how="left").dropna(subset=["date"])
sa_dated["week"] = (sa_dated["date"] // 7) + 1
weekly_scores = sa_dated[sa_dated["week"].between(1, 36)].groupby("week")["score"].mean().reset_index()
weekly_scores.columns = ["week", "avg_score"]

weekly = weekly.merge(weekly_scores, on="week", how="left")
weekly["avg_score"] = weekly["avg_score"].ffill().fillna(60).round(1)

base = datetime.date(2014, 2, 1)
weekly["date"] = weekly["week"].apply(
    lambda w: (base + datetime.timedelta(weeks=int(w) - 1)).strftime("%b %d")
)
weekly["avg_engagement"] = (
    (weekly["active_students"] / weekly["active_students"].max()) * 70 + 20
).round(1)

trends = weekly[["week", "date", "total_clicks", "active_students", "avg_engagement", "avg_score"]].to_dict("records")
trends = [{**r, "total_clicks": int(r["total_clicks"]), "active_students": int(r["active_students"])} for r in trends]
with open(f"{OUT}/trends.json", "w") as f:
    json.dump(trends, f)
print(f"[OK] trends.json")

# ── MODULE STATS ──────────────────────────────────────────────────────────────
print("Building modules.json...")
mod_stats = []
for mod, grp in df.groupby("code_module"):
    n = len(grp)
    mod_stats.append({
        "module":          mod,
        "students":        n,
        "avg_engagement":  round(float(grp["engagement_score"].mean()), 1),
        "dropout_rate":    round((grp["predicted_outcome"] == "Withdrawn").sum() / n * 100, 1),
        "pass_rate":       round(grp["predicted_outcome"].isin(["Pass", "Distinction"]).sum() / n * 100, 1),
        "at_risk_pct":     round(grp["risk_level"].isin(["High", "Critical"]).sum() / n * 100, 1),
        "avg_clicks":      int(grp["total_clicks"].mean()),
    })
mod_stats.sort(key=lambda x: -x["avg_engagement"])
with open(f"{OUT}/modules.json", "w") as f:
    json.dump(mod_stats, f)
print(f"[OK] modules.json")

# ── DEMOGRAPHICS ──────────────────────────────────────────────────────────────
print("Building demographics.json...")
def grp_stats(grp_df):
    return {
        "count":         int(len(grp_df)),
        "avg_engagement": round(float(grp_df["engagement_score"].mean()), 1),
        "at_risk_pct":   round(grp_df["risk_level"].isin(["High", "Critical"]).sum() / len(grp_df) * 100, 1),
    }

by_age     = [{"label": age, **grp_stats(g)} for age, g in df.groupby("age_band")]
by_region  = [{"label": r,   **grp_stats(g)} for r,   g in df.groupby("region")]
by_edu     = [{"label": e,   **grp_stats(g)} for e,   g in df.groupby("highest_education")]
by_outcome = [
    {"label": o, "count": int((df["predicted_outcome"] == o).sum())}
    for o in ["Pass", "Distinction", "Fail", "Withdrawn"]
]

demographics = {"by_age": by_age, "by_region": by_region, "by_education": by_edu, "by_outcome": by_outcome}
with open(f"{OUT}/demographics.json", "w") as f:
    json.dump(demographics, f)
print(f"[OK] demographics.json")

# ── AT-RISK TABLE ─────────────────────────────────────────────────────────────
print("Building at_risk.json...")
at_risk_df = df[df["risk_level"].isin(["High", "Critical"])].nsmallest(650, "engagement_score")
at_risk_records = []
for _, r in at_risk_df.iterrows():
    at_risk_records.append({
        "id":                   f"S{int(r['id_student'])}",
        "module":               r["code_module"],
        "engagement_score":     r["engagement_score"],
        "days_active":          int(r["days_active"]),
        "assessments_submitted":int(r["assessments_submitted"]),
        "risk_level":           r["risk_level"],
        "predicted_outcome":    r["predicted_outcome"],
        "avg_score":            round(float(r["avg_score"]), 1),
        "risk_proba":           round(float(r["risk_proba"]), 3),
    })
with open(f"{OUT}/at_risk.json", "w") as f:
    json.dump(at_risk_records, f)
print(f"[OK] at_risk.json  ({len(at_risk_records)} students)")

# ── SEGMENTATION ──────────────────────────────────────────────────────────────
print("Building segments.json...")
sample = df.sample(min(600, len(df)), random_state=42)
segments = []
for _, r in sample.iterrows():
    x = float(min(100, (r["total_clicks"] / max_clicks) * 100))
    y = float(r["engagement_score"])
    segments.append({
        "x":                round(x, 2),
        "y":                round(y, 2),
        "engagement_score": r["engagement_score"],
        "risk_level":       r["risk_level"],
        "risk_proba":       round(float(r["risk_proba"]), 3),
        "module":           r["code_module"],
        "predicted_outcome":r["predicted_outcome"],
    })
with open(f"{OUT}/segments.json", "w") as f:
    json.dump(segments, f)
print(f"[OK] segments.json")

# ── SUMMARY ───────────────────────────────────────────────────────────────────
print("\n" + "="*55)
print("  REAL MODEL RESULTS")
print("="*55)
print(f"  Algorithm:   Random Forest (200 trees, depth 12)")
print(f"  Train set:   {len(X_train):,} students")
print(f"  Test set:    {len(X_test):,} students")
print(f"  Accuracy:    {model_metrics['accuracy']}%")
print(f"  Precision:   {model_metrics['precision']}%")
print(f"  Recall:      {model_metrics['recall']}%")
print(f"  F1 Score:    {model_metrics['f1_score']}%")
print(f"  AUC-ROC:     {model_metrics['auc_roc']}%")
print(f"  Specificity: {model_metrics['specificity']}%")
print("="*55)
print(f"  Total students:  {total:,}")
print(f"  At-risk:         {at_risk:,} ({overview['at_risk_pct']}%)")
print(f"  Avg engagement:  {avg_eng}")
print(f"  Predicted dropout rate: {dropout}%")
print(f"  Predicted distinction:  {dist_r}%")
print("="*55)
print("\nAll JSON files written to public/data/")
print("Top 5 features by importance:")
for feat in features_json[:5]:
    print(f"  {feat['feature']:35s} {feat['importance']*100:.1f}%  [{feat['direction']}]")
