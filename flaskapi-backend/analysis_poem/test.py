from transformers import pipeline

# Inițializare pipeline zero-shot
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Poezia ta
poem_text = (
    "Te vreau, e greu să explic tot,§Te vreau, alergând ca un idiot!§Te vreau, aşa cum eşti,§Te vreau și cum vei fi...§§Te vreau, o expresie ce ţi-aş fi şoptit...§Te vreau, alergând ca un tâmpit!§Te vreau, în dimineața caldă ce frumusețea ți-o arată,§Te vreau și în noaptea rece, când brațele tale mă-nfășoară...§§Te vreau, cuvinte de le-aș fi vorbit...§Te vreau, alergând ca un smucit!§Te vreau, când privirea ta de foc mă lovește,§Te vreau și când gândul tabloul tău mi-l amintește...§§Te vreau, egoist vorbele le cânt,§Te vreau, alergând și când mă simt înfrânt...§Te vreau, şi vreau să te sărut,§Te vreau, și vreau să-ți duc secretul în mormânt...§§Te vreau, cu o ultimă strigare!§Te vreau, alergând fără frânare!§Te vreau, te vreau, te vreau pe tine!§Te vreau, şi sufletul meu îţi apartine..."
)

# Emoții posibile (în română)
candidate_labels = [
    "speranță", "iubire", "tristețe", "bucurie",
    "teamă", "regret", "singurătate", "liniște", "admirație", "nostalgie"
]

# Clasificare
result = classifier(poem_text, candidate_labels, hypothesis_template="Această poezie exprimă {}.")

# Rezultate sortate
for label, score in zip(result["labels"], result["scores"]):
    print(f"{label:<15}: {score:.3f}")
