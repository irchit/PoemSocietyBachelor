
def extract_emotions(sentiment_list):
    result = {}
    for entry in sentiment_list:
        emotion_obj, score = entry
        emotion_en = emotion_obj["en"]
        result[emotion_en] = score
    return result

def update_emotion_score(n, p, w, b=0.1, min_score=0.01, max_score=1):
    """
    Update user emotion score based on:
    - n: current emotion score
    - p: poem emotion intensity for that emotion
    - w: interaction weight (can be negative)
    - b: blend factor (learning rate)
    """
    if w == 0:
        return n  # no change if no interaction

    sign = w / abs(w)
    delta = b * sign * (1 - n) * p * abs(w)
    new_score = n + delta

    return round(max(min_score, min(new_score, max_score)), 6)



def update_emotions(user_emotions, poem, interaction_score, alpha=0.1):
    poem_emotions = poem["analysis"]["sentiment"]
    poem_emotions = extract_emotions(poem_emotions)

    for emotion, weight in poem_emotions.items():
        current = user_emotions.get(emotion, 0.01)
        user_emotions[emotion] = update_emotion_score(current, weight, interaction_score, alpha)
    return user_emotions
