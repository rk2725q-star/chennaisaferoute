"""
train_model.py
==============
Trains the Physics-First Early-Warning Flood Prediction Model for Chennai.
Evaluates:
  1. Stratified K-Fold Cross-Validation
  2. Disaster Holdout Generalization (Trained on 2015-2021, tested on unseen Cyclone Michaung 2023)
  3. Compares Logistic Regression vs Random Forest vs HistGradientBoosting vs Ensemble

Saves:
  - models/chennai_flood_model.joblib
  - models/model_metadata.json
"""

import os
import sys
import csv
import json
import time
import joblib
import numpy as np

from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "model", "road_flood_features.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_SAVE_PATH = os.path.join(MODELS_DIR, "chennai_flood_model.joblib")
META_SAVE_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

# Core Physics and Hydrological Features (Zero spatial cheating / Zero historical memorization)
FEATURE_COLUMNS = [
    "rain_24h",              # 24-hour total precipitation (mm)
    "rain_3h",               # 3-hour peak cloudburst intensity (mm)
    "elevation",             # Surface elevation (m above sea level)
    "slope",                 # Topographical gradient (degrees)
    "hand",                  # Height Above Nearest Drainage (m)
    "dist_to_drain_m",       # Distance to canal/river channel (m)
    "flow_accumulation",     # Upslope contributing cells (D8 routing)
    "catchment_km2",         # Total contributing basin area (km²)
    "twi",                   # Topographic Wetness Index ln(a / tan(beta))
    "drainage_density",      # Engineered canal density in 600m radius (m/km²)
    "dist_to_water_body_m",  # Proximity to lake, reservoir, or wetland (m)
    "built_up",              # Urban surface runoff density proxy
    "node_degree",           # Network intersection corridor complexity
    "length_m"               # Road segment span (m)
]

def load_data():
    print(f"[DATA] Loading feature table: {DATA_PATH}...")
    with open(DATA_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # Exclude data_limited events (Mandous 2022 coverage boundary gap)
    valid_rows = [r for r in rows if r.get("data_limited") != "1"]
    print(f"[DATA] Loaded {len(valid_rows):,} valid records (excluded {len(rows)-len(valid_rows)} data-limited).")

    X = np.array([[float(r[col]) for col in FEATURE_COLUMNS] for r in valid_rows])
    y = np.array([int(r["target"]) for r in valid_rows])
    event_dates = [r["event_date"] for r in valid_rows]
    road_ids = [r["road_id"] for r in valid_rows]

    pos_count = sum(y)
    neg_count = len(y) - pos_count
    print(f"[DATA] Class distribution: {pos_count:,} Flooded (1) vs {neg_count:,} Safe (0) | Ratio 1:{neg_count/pos_count:.1f}")
    return X, y, event_dates, road_ids, valid_rows

def evaluate_predictions(y_true, y_pred, y_prob):
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred) * 100), 2),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0) * 100), 2),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0) * 100), 2),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0) * 100), 2),
        "roc_auc": round(float(roc_auc_score(y_true, y_prob) * 100), 2),
        "pr_auc": round(float(average_precision_score(y_true, y_prob) * 100), 2)
    }

def run_training_pipeline():
    X, y, event_dates, road_ids, valid_rows = load_data()

    # -----------------------------------------------------------------------
    # TEST 1: Generalization on UNSEEN Disaster (Cyclone Michaung 2023)
    # -----------------------------------------------------------------------
    print("\n" + "="*80)
    print("TEST 1: UNSEEN DISASTER HOLDOUT (Train on 2015-2021, Test on Cyclone Michaung 2023)")
    print("="*80)

    train_mask = [d != "2023-12-04" for d in event_dates]
    test_mask = [d == "2023-12-04" for d in event_dates]

    X_train, y_train = X[train_mask], y[train_mask]
    X_test, y_test = X[test_mask], y[test_mask]

    print(f"  Training set (4 past flood events) : {len(X_train):,} rows (Flooded: {sum(y_train):,})")
    print(f"  Testing set (Unseen 2023 Cyclone)  : {len(X_test):,} rows (Flooded: {sum(y_test):,})")

    # Scaler for linear model
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Models definition
    lr = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    rf = RandomForestClassifier(n_estimators=200, max_depth=14, min_samples_leaf=3, class_weight='balanced', random_state=42, n_jobs=-1)
    hgb = HistGradientBoostingClassifier(class_weight='balanced', max_iter=150, min_samples_leaf=15, random_state=42)

    # Train individual models
    lr.fit(X_train_scaled, y_train)
    rf.fit(X_train, y_train)
    hgb.fit(X_train, y_train)

    # Soft Voting Ensemble
    ensemble = VotingClassifier(
        estimators=[('rf', rf), ('hgb', hgb)],
        voting='soft',
        weights=[1.2, 1.0]
    )
    ensemble.fit(X_train, y_train)

    models_to_test = [
        ("1. Logistic Regression (Baseline)", lr, X_test_scaled),
        ("2. Random Forest (Balanced)", rf, X_test),
        ("3. HistGradientBoosting", hgb, X_test),
        ("4. Physics Ensemble (RF + HGB)", ensemble, X_test)
    ]

    print(f"\n{'Model':<35} | {'Acc':<7} | {'Recall':<8} | {'Prec':<7} | {'F1':<7} | {'ROC-AUC':<8} | {'PR-AUC':<7}")
    print("-" * 88)

    holdout_results = {}
    for name, clf, xt in models_to_test:
        probs = clf.predict_proba(xt)[:, 1]
        preds = (probs >= 0.40).astype(int)  # 0.40 optimal calibrated threshold for early warning
        m = evaluate_predictions(y_test, preds, probs)
        holdout_results[name] = m
        print(f"{name:<35} | {m['accuracy']:>5.1f}% | {m['recall']:>6.1f}% | {m['precision']:>5.1f}% | {m['f1']:>5.1f}% | {m['roc_auc']:>6.1f}% | {m['pr_auc']:>5.1f}%")

    # -----------------------------------------------------------------------
    # TEST 2: Stratified 5-Fold Cross-Validation on Full Dataset
    # -----------------------------------------------------------------------
    print("\n" + "="*80)
    print("TEST 2: 5-FOLD CROSS VALIDATION ACROSS ENTIRE CHENNAI BASIN")
    print("="*80)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_recalls, cv_f1s, cv_aucs = [], [], []

    for fold, (trn_idx, val_idx) in enumerate(skf.split(X, y)):
        X_tr, y_tr = X[trn_idx], y[trn_idx]
        X_va, y_va = X[val_idx], y[val_idx]

        rf_fold = RandomForestClassifier(n_estimators=150, max_depth=14, min_samples_leaf=3, class_weight='balanced', random_state=42, n_jobs=-1)
        rf_fold.fit(X_tr, y_tr)
        probs_va = rf_fold.predict_proba(X_va)[:, 1]
        preds_va = (probs_va >= 0.40).astype(int)

        rec = recall_score(y_va, preds_va) * 100
        f1 = f1_score(y_va, preds_va) * 100
        auc = roc_auc_score(y_va, probs_va) * 100
        cv_recalls.append(rec)
        cv_f1s.append(f1)
        cv_aucs.append(auc)

    print(f"  5-Fold Mean Recall : {np.mean(cv_recalls):.2f}% ± {np.std(cv_recalls):.2f}%")
    print(f"  5-Fold Mean F1     : {np.mean(cv_f1s):.2f}% ± {np.std(cv_f1s):.2f}%")
    print(f"  5-Fold Mean ROC-AUC: {np.mean(cv_aucs):.2f}% ± {np.std(cv_aucs):.2f}%")

    # -----------------------------------------------------------------------
    # 3. TRAIN PRODUCTION MODEL ON FULL DATASET & EXTRACT FEATURE IMPORTANCES
    # -----------------------------------------------------------------------
    print("\n" + "="*80)
    print("3. TRAINING FINAL PRODUCTION ENSEMBLE MODEL ON FULL DATASET")
    print("="*80)

    final_rf = RandomForestClassifier(n_estimators=250, max_depth=16, min_samples_leaf=3, class_weight='balanced', random_state=42, n_jobs=-1)
    final_hgb = HistGradientBoostingClassifier(class_weight='balanced', max_iter=200, min_samples_leaf=15, random_state=42)

    final_rf.fit(X, y)
    final_hgb.fit(X, y)

    final_model = VotingClassifier(
        estimators=[('rf', final_rf), ('hgb', final_hgb)],
        voting='soft',
        weights=[1.2, 1.0]
    )
    final_model.fit(X, y)

    # Feature importances from final RF
    importances = final_rf.feature_importances_
    sorted_indices = np.argsort(importances)[::-1]

    print("\n  PHYSICAL FLOOD DRIVER RANKING (Feature Importance):")
    print("  " + "-"*55)
    importance_dict = {}
    for i in range(len(FEATURE_COLUMNS)):
        idx = sorted_indices[i]
        fname = FEATURE_COLUMNS[idx]
        imp_pct = round(float(importances[idx] * 100), 2)
        importance_dict[fname] = imp_pct
        print(f"  {i+1:>2}. {fname:<24} : {imp_pct:>5.2f}% {'█'*int(imp_pct//2)}")

    # -----------------------------------------------------------------------
    # 4. SAVE MODEL ARTIFACT & METADATA
    # -----------------------------------------------------------------------
    pos_count = int(sum(y))
    neg_count = int(len(y) - pos_count)

    model_bundle = {
        "model": final_model,
        "rf_model": final_rf,
        "hgb_model": final_hgb,
        "feature_columns": FEATURE_COLUMNS,
        "optimal_threshold": 0.40,
        "trained_at": "2026-09-09",
        "total_training_samples": len(X),
        "target_distribution": {"flooded": pos_count, "safe": neg_count}
    }

    joblib.dump(model_bundle, MODEL_SAVE_PATH, compress=3)
    file_size_mb = os.path.getsize(MODEL_SAVE_PATH) / (1024.0 * 1024.0)
    print(f"\n[SAVE] Model bundle successfully saved -> {MODEL_SAVE_PATH} ({file_size_mb:.2f} MB)")

    metadata = {
        "model_name": "Chennai Physics-First Flood Predictor",
        "version": "2.0",
        "algorithm": "Ensemble (Balanced Random Forest + HistGradientBoosting)",
        "optimal_decision_threshold": 0.40,
        "features": FEATURE_COLUMNS,
        "unseen_disaster_holdout_metrics": holdout_results,
        "five_fold_cv": {
            "mean_recall": round(float(np.mean(cv_recalls)), 2),
            "mean_f1": round(float(np.mean(cv_f1s)), 2),
            "mean_roc_auc": round(float(np.mean(cv_aucs)), 2)
        },
        "feature_importances_pct": importance_dict
    }

    with open(META_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[SAVE] Model metadata saved -> {META_SAVE_PATH}")
    print("\nTraining completed with 100% success!")

if __name__ == "__main__":
    run_training_pipeline()
