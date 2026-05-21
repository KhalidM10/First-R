"""
MedAssist AI — Triage Model Training Pipeline (Phase 2)

This script trains a hybrid ML model using labelled triage session data
collected from the rule-based engine in Phase 1.

Usage:
    python train.py --data data/triage_sessions.csv --output models/triage_v1.pkl

Phase 1 (current): rule-based engine collects labelled data
Phase 2 (this script): train sklearn classifier on that corpus
Phase 3: A/B test ML predictions against rule engine; promote when ML wins
"""
import argparse
import json
import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer


SEVERITY_LABELS = ["mild", "moderate", "urgent"]


def load_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    required_cols = {"symptoms_text", "severity_level", "user_age", "duration_days"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in training data: {missing}")
    return df


def preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    df = df.dropna(subset=["symptoms_text", "severity_level"])
    df["symptoms_text"] = df["symptoms_text"].str.lower().str.strip()
    df["user_age"] = df["user_age"].fillna(df["user_age"].median())
    df["duration_days"] = df["duration_days"].fillna(1)

    X = df["symptoms_text"]
    y = LabelEncoder().fit_transform(df["severity_level"])
    return X, y


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
        )),
        ("clf", GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=4,
            random_state=42,
        )),
    ])


def train(data_path: str, output_path: str) -> None:
    print(f"Loading data from {data_path}...")
    df = load_data(data_path)
    print(f"  {len(df)} training samples loaded")

    X, y = preprocess(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training gradient boosting classifier...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    print("\nEvaluation on test set:")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred, target_names=SEVERITY_LABELS))

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "wb") as f:
        pickle.dump(pipeline, f)

    metadata = {
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": "tfidf_bigram",
        "model": "GradientBoostingClassifier",
        "severity_labels": SEVERITY_LABELS,
    }
    with open(output.with_suffix(".meta.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nModel saved to {output}")
    print(f"Metadata saved to {output.with_suffix('.meta.json')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train MedAssist AI triage model")
    parser.add_argument("--data", default="data/triage_sessions.csv")
    parser.add_argument("--output", default="models/triage_v1.pkl")
    args = parser.parse_args()
    train(args.data, args.output)
