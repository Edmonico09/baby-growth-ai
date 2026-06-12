"""
Train RandomForest models for weight and height prediction.

Usage:
    python services/ml/train_growth_model.py

Loads training_growth_dataset.csv, trains two models, saves to models/.
Prints MAE, RMSE, R² for each.
"""

import sys
import warnings
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore", category=UserWarning)

BASE = Path(__file__).parent.parent.parent
DATASET = BASE / "training_growth_dataset.csv"
MODELS_DIR = BASE / "models"
WEIGHT_MODEL = MODELS_DIR / "weight_model.pkl"
HEIGHT_MODEL = MODELS_DIR / "height_model.pkl"

FEATURES = [
    "age_months",
    "birth_weight",
    "birth_length",
    "current_weight",
    "current_height",
    "current_head_circumference",
    "weight_percentile",
    "height_percentile",
    "head_percentile",
    "weight_zscore",
    "height_zscore",
    "head_zscore",
    "weight_gain_last_month",
    "height_gain_last_month",
]

CAT_FEATURES = ["sex"]


def _prepare_data(df: pd.DataFrame, target_col: str):
    df = df.dropna(subset=FEATURES + [target_col]).copy()
    df["sex"] = (df["sex"] == "male").astype(int)
    X = df[FEATURES + CAT_FEATURES].values
    y = df[target_col].values
    return X, y


def _train_model(X, y, name: str):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=15,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = r2_score(y_test, y_pred)

    print(f"\n  {name}:")
    print(f"    MAE : {mae:.4f}")
    print(f"    RMSE: {rmse:.4f}")
    print(f"    R²  : {r2:.4f}")

    return model, {"mae": mae, "rmse": rmse, "r2": r2}


def train():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if not DATASET.exists():
        print(f"Dataset not found: {DATASET}")
        print("Run scripts/generate_training_dataset.py first.")
        sys.exit(1)

    df = pd.read_csv(DATASET)
    print(f"Loaded dataset: {len(df)} rows")

    X_w, y_w = _prepare_data(df, "target_weight_next_month")
    print(f"\nWeight model — {len(X_w)} samples")
    weight_model, w_metrics = _train_model(X_w, y_w, "Weight")

    X_h, y_h = _prepare_data(df, "target_height_next_month")
    print(f"\nHeight model — {len(X_h)} samples")
    height_model, h_metrics = _train_model(X_h, y_h, "Height")

    joblib.dump(weight_model, WEIGHT_MODEL)
    joblib.dump(height_model, HEIGHT_MODEL)
    print(f"\nModels saved:")
    print(f"  {WEIGHT_MODEL}")
    print(f"  {HEIGHT_MODEL}")

    metrics = {"weight": w_metrics, "height": h_metrics}
    metrics_path = MODELS_DIR / "metrics.json"
    import json
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  {metrics_path}")


if __name__ == "__main__":
    train()
