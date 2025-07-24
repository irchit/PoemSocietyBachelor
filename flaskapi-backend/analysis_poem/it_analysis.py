from transformers import pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from stop_words import get_stop_words
import re

stop_words = get_stop_words('italian')

def clean_text(text):
    return re.sub(r'[^\w\s]', '', text.lower())

# Zero-shot emotion classifier
emotion_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def get_sentiment_it(text):
    candidate_labels = ["speranza", "amore", "tristezza", "gioia", "paura", "rimpianto", "solitudine", "calma", "ammirazione", "nostalgia"]
    result = emotion_classifier(text[:512], candidate_labels, hypothesis_template="Această poezie exprimă {}.")
    top3 = list(zip(result['labels'], result['scores']))[:3]
    return [{"label": label, "score": round(score, 3)} for label, score in top3]

def get_theme_it(text):
    summarizer = pipeline("summarization", model="facebook/mbart-large-cc25")
    return summarizer(text, max_length=30, min_length=5, do_sample=False)[0]['summary_text']

def get_keywords_it(text, max_keywords=10):
    vectorizer = TfidfVectorizer(stop_words=stop_words)
    X = vectorizer.fit_transform([clean_text(text)])
    keywords = zip(vectorizer.get_feature_names_out(), X.toarray()[0])
    return [word for word, _ in sorted(keywords, key=lambda x: x[1], reverse=True)[:max_keywords]]
