from langdetect import detect
from analysis_poem.en_analysis import *
from analysis_poem.ro_analysis import *
from analysis_poem.es_analysis import *
from analysis_poem.de_analysis import *
from analysis_poem.it_analysis import *
from analysis_poem.fr_analysis import *
from analysis_poem.emotion_sets import emotion_sets

def map_emotions_to_multilang(emotions_with_scores, lang_code):
    """
    Primește lista de emoții în limba `lang_code` + scoruri
    Returnează o listă de dicționare: [{lang1: emo1, ..., score: x}, ...]
    """
    results = []

    for emo in emotions_with_scores:
        for emo_set in emotion_sets:
            if emo_set[lang_code] == emo["label"]:
                results.append([emo_set, emo["score"]])
                break

    return results


# === Funcție principală ===
def analyze_poem(poem_text):
    poem_text.replace("§§", "\n\n")
    poem_text.replace("§", "\n")
    try:
        lang_code = detect(poem_text)
    except:
        lang_code = "unknown"

    if lang_code == "ro":
        emotions = get_sentiment_ro(poem_text)  # returnează: [("iubire", 0.82), ("tristețe", 0.45)]
    elif lang_code == "es":
        emotions = get_sentiment_es(poem_text)
    elif lang_code == "de":
        emotions = get_sentiment_de(poem_text)
    elif lang_code == "it":
        emotions = get_sentiment_it(poem_text)
    elif lang_code == "fr":
        emotions = get_sentiment_fr(poem_text)
    else:
        emotions = get_sentiment_en(poem_text)

    # === Nou: mapare emoții în toate limbile ===
    if lang_code not in ["en", "de", "it", "fr", "es", "ro"]:
        lang_code = "unknown"
        multilingual_emotions = map_emotions_to_multilang(emotions, "en")
    else:
        multilingual_emotions = map_emotions_to_multilang(emotions, lang_code)
        


    result = {
        "language": lang_code,
        "sentiment": multilingual_emotions,
        "theme": None
    }

    if lang_code == "ro":
        result["theme"] = get_theme_ro(poem_text)

    elif lang_code == "es":
        result["theme"] = get_theme_es(poem_text)

    elif lang_code == "de":
        result["theme"] = get_theme_de(poem_text)

    elif lang_code == "it":
        result["theme"] = get_theme_it(poem_text)

    elif lang_code == "fr":
        result["theme"] = get_theme_fr(poem_text)

    else:
        result["theme"] = get_theme_en(poem_text)

    return result

# === Exemplu de rulare ===
if __name__ == "__main__":
    # poem = """
    # Ploaia cade lin peste orașul gol,
    # Amintiri rămân în pașii grei de dor.
    # Timpul curge tăcut printr-un ceas ruginit,
    # Iar sufletul visează ce a fost și-a pierit.
    # """

    poem = "Te vreau, e greu să explic tot,§Te vreau, alergând ca un idiot!§Te vreau, aşa cum eşti,§Te vreau și cum vei fi...§§Te vreau, o expresie ce ţi-aş fi şoptit...§Te vreau, alergând ca un tâmpit!§Te vreau, în dimineața caldă ce frumusețea ți-o arată,§Te vreau și în noaptea rece, când brațele tale mă-nfășoară...§§Te vreau, cuvinte de le-aș fi vorbit...§Te vreau, alergând ca un smucit!§Te vreau, când privirea ta de foc mă lovește,§Te vreau și când gândul tabloul tău mi-l amintește...§§Te vreau, egoist vorbele le cânt,§Te vreau, alergând și când mă simt înfrânt...§Te vreau, şi vreau să te sărut,§Te vreau, și vreau să-ți duc secretul în mormânt...§§Te vreau, cu o ultimă strigare!§Te vreau, alergând fără frânare!§Te vreau, te vreau, te vreau pe tine!§Te vreau, şi sufletul meu îţi apartine..."
    output = analyze_poem(poem)
    print("=== Rezultat analiză poezie ===")
    print(output)
