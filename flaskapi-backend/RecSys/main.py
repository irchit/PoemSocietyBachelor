from collections import defaultdict
from numpy import array, dot
from numpy.linalg import norm
import random

def calc_user_similarities(user_activ, user_list, following_list):
    """
    Calculează scorul de similaritate între utilizatorul activ și ceilalți utilizatori.
    Similaritatea se bazează pe:
    - cosine similarity pentru preferințele de emoții
    - cosine similarity pentru limbile preferate
    - bonus dacă utilizatorul activ îl urmărește pe celălalt (sau invers)

    Parametri:
        user_activ: dict - utilizatorul activ (obiect JSON din MongoDB)
        user_list: list[dict] - lista tuturor utilizatorilor (obiecte JSON)
        following_list: list[dict] - lista relațiilor de urmărire (cu "who", "whom")

    Returnează:
        dict[user_id] = similarity_score
    """

    def cosine_sim(v1, v2):
        a, b = array(v1), array(v2)
        return dot(a, b) / (norm(a) * norm(b)) if norm(a) != 0 and norm(b) != 0 else 0

    id_activ = user_activ["_id"]
    emotions_activ = user_activ["preferences"]["emotions"]
    languages_activ = user_activ["preferences"]["languages"]

    # Asigură ordinea fixă a cheilor
    emotion_keys = sorted(emotions_activ.keys())
    language_keys = sorted(languages_activ.keys())

    vec_emotions_activ = [emotions_activ[k] for k in emotion_keys]
    vec_languages_activ = [languages_activ[k] for k in language_keys]

    following_pairs = set((f["who"], f["whom"]) for f in following_list)

    similarities = {}

    for user in user_list:
        uid = user["_id"]
        if uid == id_activ:
            continue  # nu comparăm cu sine

        emotions_other = user["preferences"]["emotions"]
        languages_other = user["preferences"]["languages"]

        vec_emotions_other = [emotions_other.get(k, 0.0) for k in emotion_keys]
        vec_languages_other = [languages_other.get(k, 0.0) for k in language_keys]

        sim_emotions = cosine_sim(vec_emotions_activ, vec_emotions_other)
        sim_languages = cosine_sim(vec_languages_activ, vec_languages_other)
        sim_score = (sim_emotions + sim_languages) / 2

        # Bonus dacă există relație de following
        if (id_activ, uid) in following_pairs:
            sim_score = sim_score * 0.8 + 0.2
        elif (uid, id_activ) in following_pairs:
            sim_score = sim_score * 0.95 + 0.05

        similarities[uid] = round(sim_score, 4)

    return similarities

def get_seen_unseen_poems(user, views, all_poems):
    """
    Returnează poemele văzute și nevăzute de un utilizator.

    Parametri:
        user: dict - utilizatorul activ
        views: list[dict] - lista tuturor vizualizărilor
        all_poems: list[dict] - lista completă de poeme

    Returnează:
        (seen_poems, unseen_poems) - ambele ca seturi de poem _id
    """
    user_id = user["_id"]

    seen_poems = set(view["post_id"] for view in views if view["who"] == user_id)
    all_poem_ids = set(poem["_id"] for poem in all_poems)
    unseen_poems = all_poem_ids - seen_poems

    return seen_poems, unseen_poems

def predict_cb_views(user, poems_unseen):
    """
    Calculează scoruri content-based pentru poemele nevăzute de un utilizator.

    Parametri:
        user: dict - utilizatorul activ
        poems_unseen: list[dict] - lista cu poemele nevăzute

    Returnează:
        list[dict]: fiecare element are 'poem_id' și 'cb_score'
    """
    preferences = user["preferences"]
    emo_prefs = preferences["emotions"]
    lang_prefs = preferences["languages"]

    predictions = []

    for poem in poems_unseen:
        poem_id = poem["_id"]
        lang = poem["analysis"]["language"]
        sentiments = poem["analysis"]["sentiment"]  # list of 3 (emotion_dict, score)

        # Preferință limbă
        lang_score = lang_prefs.get(lang, 0.0)

        # Emoții poem
        emotion_scores = []
        for i in range(3):
            if i < len(sentiments):
                emotion_dict, _score = sentiments[i]
                ro_emotion = emotion_dict["ro"]
                user_pref = emo_prefs.get(ro_emotion, 0.0)
                emotion_scores.append(user_pref)
            else:
                emotion_scores.append(0.0)  # fallback dacă lipsesc

        # Scor final CBF
        cb_score = (
            0.25 * lang_score +
            0.30 * emotion_scores[0] +
            0.25 * emotion_scores[1] +
            0.20 * emotion_scores[2]
        )

        predictions.append({
            "poem_id": poem_id,
            "cb_score": round(cb_score, 4)
        })

    return predictions

def hybrid_recommendations(user_activ, users, views, poems, following_list):

    if not user_activ:
        random_poems = random.sample(poems, min(10, len(poems)))
        return [{"poem": p, "score": 0} for p in random_poems]

    # 1. Similarități user-user
    sim_scores = calc_user_similarities(user_activ, users, following_list)

    # Sortăm userii descrescător după scor de similaritate
    top_users = sorted(sim_scores.items(), key=lambda x: x[1], reverse=True)

    # 2. Seen/unseen
    seen, unseen = get_seen_unseen_poems(user_activ, views, poems)
    poems_dict = {poem["_id"]: poem for poem in poems}
    
    # 3. Calculăm scoruri agregate pentru fiecare poem nevăzut
    poem_scores = defaultdict(float)

    for view in views:
        poem_id = view["post_id"]
        viewer_id = view["who"]

        # doar pentru poeme nevăzute de userul activ
        if poem_id not in unseen:
            continue

        # doar dacă viewer-ul este în top_user_ids
        if viewer_id not in sim_scores:
            continue

        # scorul total = similaritate * scorul vizualizării (view["score"])
        similarity = sim_scores[viewer_id]
        poem_scores[poem_id] += similarity * view["score"]

    # 4. Selectăm top_k poeme în funcție de scorurile din CF
    top_k = 10
    top_poem_ids = sorted(poem_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    selected_poem_ids = [pid for pid, _ in top_poem_ids]

    # Dacă lipsesc poeme, completăm cu random din unseen
    if len(selected_poem_ids) < top_k:
        remaining_unseen = list(unseen - set(selected_poem_ids))
        needed = top_k - len(selected_poem_ids)

        # Random din unseen (fără replacement dacă sunt puține)
        random_unseen = random.sample(remaining_unseen, min(needed, len(remaining_unseen)))
        selected_poem_ids.extend(random_unseen)

    # Dacă tot lipsesc, completăm cu random din seen
    if len(selected_poem_ids) < top_k:
        remaining_seen = list(seen - set(selected_poem_ids))
        still_needed = top_k - len(selected_poem_ids)

        random_seen = random.sample(remaining_seen, min(still_needed, len(remaining_seen)))
        selected_poem_ids.extend(random_seen)

    # Construim lista completă de poeme selectate
    selected_poems = [poems_dict[pid] for pid in selected_poem_ids]

    # 5. Aplicăm content-based filtering pe aceste poeme
    predicted = predict_cb_views(user_activ, selected_poems)

    # 6. Întoarcem lista completă: poem + scor
    recomandari = [
        {"poem": poems_dict[pred["poem_id"]], "score": pred["cb_score"]}
        for pred in sorted(predicted, key=lambda x: x["cb_score"], reverse=True)
    ]

    return recomandari



import json
from pymongo import MongoClient

def main():
    # 1. Conectare la MongoDB local
    client = MongoClient("mongodb://localhost:27017")
    db = client["local"]

    # 2. Colectăm datele
    users = list(db.Utilizator.find())
    poems = list(db.Poezie.find())
    views = list(db.Views.find())
    following = list(db.Following.find())

    # 3. Selectăm utilizatorul activ (ex: cu _id = 27)
    user_activ = next((u for u in users if u["_id"] == 27), None)
    if not user_activ:
        print("Utilizatorul cu ID 1 nu a fost găsit.")
        return

    # 4. Apelăm funcția de recomandare
    recomandari = hybrid_recommendations(user_activ, users, views, poems, following)

    # 5. Salvăm rezultatele într-un fișier JSON
    with open("recomandari.json", "w", encoding="utf-8") as f:
        json.dump(recomandari, f, ensure_ascii=False, indent=2)

    print("Recomandările au fost salvate în 'recomandari.json'.")

if __name__ == "__main__":
    main()
