from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo import DESCENDING
from datetime import datetime
from analysis_poem.main import analyze_poem
from RecSys.score_emotion_modifier import *
from RecSys.score_language_modifier import *
from RecSys.main import hybrid_recommendations
import re

app = Flask(__name__)
CORS(app)

# 🔧 Conectare MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["local"]
users_col = db["Utilizator"] 
poems_col = db["Poezie"]
comments_col = db["Comments"]
likes_col = db["Likes"]
bookmarks_col = db["Bookmarks"]
following_col = db["Following"]
views_col = db["Views"]

# 🔁 Conversie ObjectId → string
def convert_ids(doc):
    if isinstance(doc, list):
        return [convert_ids(d) for d in doc]
    if isinstance(doc, dict):
        return {k: convert_ids(v) for k, v in doc.items()}
    return str(doc) if type(doc).__name__ == "ObjectId" else doc

# ✅ GET toate poeziile
@app.route('/poems', methods=['GET'])
def get_poems():
    result = []
    for poem in poems_col.find():
        poem_id = poem['_id']

        comments = list(comments_col.find({"poem_id": poem_id}))
        poem['likes_count'] = likes_col.count_documents({"poem_id": poem_id})
        poem['saves_count'] = bookmarks_col.count_documents({"poem_id": poem_id})
        poem['comments'] = comments
        poem["views"] = views_col.count_documents({"post_id": poem["_id"]})

        # add in Poem Comments based on user_id, username.
        for comment in poem['comments']:
            user = users_col.find_one({"_id": comment['user_id']})
            if user:
                comment['username'] = user['username']

        result.append(poem)

    return jsonify(convert_ids(result))

@app.route('/poems/following/<int:user_id>', methods=['GET'])
def get_poems_from_following(user_id):
    # Găsește toți cei pe care userul îi urmărește
    following = list(following_col.find({"who": user_id}))
    followed_usernames = [
        users_col.find_one({"_id": f["whom"]})["username"]
        for f in following
        if users_col.find_one({"_id": f["whom"]})
    ]

    # Găsește poeziile postate de utilizatorii urmăriți, ordonate descrescător
    poems = list(
        poems_col.find({"user": {"$in": followed_usernames}})
                 .sort("posted_at", -1)  # 🠖 SORTARE DESC
    )

    result = []
    for poem in poems:
        poem_id = poem['_id']

        comments = list(comments_col.find({"poem_id": poem_id}))
        poem['likes_count'] = likes_col.count_documents({"poem_id": poem_id})
        poem['saves_count'] = bookmarks_col.count_documents({"poem_id": poem_id})
        poem['comments'] = comments        
        poem["views"] = views_col.count_documents({"post_id": poem["_id"]})


        for comment in poem['comments']:
            user = users_col.find_one({"_id": comment['user_id']})
            if user:
                comment['username'] = user['username']

        result.append(poem)

    return jsonify(convert_ids(result))


# ✅ GET o poezie după ID
@app.route('/poems/<int:id>', methods=['GET'])
def get_poem(id):
    poem = poems_col.find_one({"_id": id})
    if not poem:
        return jsonify({"error": "Poem not found"}), 404

    comments = list(comments_col.find({"poem_id": id}))
    poem['likes_count'] = likes_col.count_documents({"poem_id": id})
    poem['saves_count'] = bookmarks_col.count_documents({"poem_id": id})
    poem["views"] = views_col.count_documents({"post_id": poem["_id"]})
    poem['comments'] = comments
    for comment in poem['comments']:
            user = users_col.find_one({"_id": comment['user_id']})
            if user:
                comment['username'] = user['username']

    return jsonify(convert_ids(poem))

# ✅ REGISTER
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")

    if users_col.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 409
    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 409

    new_user = {
        "_id": users_col.count_documents({}) + 1,
        "username": username,
        "password": data.get("password"),
        "name": data.get("name"),
        "lastname": data.get("lastname"),
        "gender": data.get("gender"),
        "birthday": data.get("birth"),
        "created_at": datetime.utcnow().isoformat() + "Z",
        "email": email
    }

    users_col.insert_one(new_user)
    return jsonify({"message": "User registered successfully"}), 201

# ✅ LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = users_col.find_one({
        "username": data.get("username"),
        "password": data.get("password")
    })

    if user:
        return jsonify({
            "message": "Login successful",
            "id": user["_id"],
            "username": user["username"],
            "name": user["name"],
            "lastname": user["lastname"],
            "gender": user["gender"],
            "birthday": user["birthday"],
            "email": user["email"],
            "bio": user.get("bio", "")
        })
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/likes/check/<int:poem_id>/by/<int:user_id>', methods=['GET'])
def check_like(poem_id, user_id):
    bookmark = likes_col.find_one({
        "poem_id": poem_id,
        "user_id": user_id
    })

    return jsonify({
        "liked": bookmark is not None
    })

@app.route('/bookmarks/check/<int:poem_id>/by/<int:user_id>', methods=['GET'])
def check_bookmark(poem_id, user_id):
    bookmark = bookmarks_col.find_one({
        "poem_id": poem_id,
        "user_id": user_id
    })

    return jsonify({
        "bookmarked": bookmark is not None
    })

@app.route('/bookmarks/toggle', methods=['POST'])
def toggle_bookmark():
    data = request.json
    user_id = data.get("user_id")
    poem_id = data.get("poem_id")
    print(f"Toggle bookmark for user {user_id} and poem {poem_id}")

    if not user_id or not poem_id:
        return jsonify({"error": "Missing user_id or poem_id"}), 400

    existing = bookmarks_col.find_one({
        "user_id": user_id,
        "poem_id": poem_id
    })
    poem = poems_col.find_one({"_id": poem_id})

    if existing:
        # Delete bookmark
        bookmarks_col.delete_one({"_id": existing["_id"]})
        views_col.update_one(
            {"who": user_id, "post_id": poem_id},
            {"$inc": {"score": -0.45}},
            upsert=True
        )

        current_user_emotions = users_col.find_one({"_id": user_id})["preferences"]["emotions"]
        new_user_emotions = update_emotions(current_user_emotions, poem, -0.35)

        users_col.update_one({"_id": user_id}, {
            "$set": {"preferences.emotions": new_user_emotions}
        })

        return jsonify({"message": "Bookmark removed", "bookmarked": False}), 200
    else:
        # Insert new bookmark
        bookmarks_col.insert_one({
            "user_id": user_id,
            "poem_id": poem_id,
            "saved_at": datetime.utcnow().isoformat() + "Z"
        })
        
        views_col.update_one(
            {"who": user_id, "post_id": poem_id},
            {"$inc": {"score": 0.45}},
            upsert=True
        )

        current_user_emotions = users_col.find_one({"_id": user_id})["preferences"]["emotions"]
        new_user_emotions = update_emotions(current_user_emotions, poem, 0.45)

        users_col.update_one({"_id": user_id}, {
            "$set": {"preferences.emotions": new_user_emotions}
        })


        return jsonify({"message": "Bookmark added", "bookmarked": True}), 201

@app.route('/likes/toggle', methods=['POST'])
def toggle_like():
    data = request.json
    user_id = data.get("user_id")
    poem_id = data.get("poem_id")
    print(f"Toggle like for user {user_id} and poem {poem_id}")

    if not user_id or not poem_id:
        return jsonify({"error": "Missing user_id or poem_id"}), 400

    existing = likes_col.find_one({
        "user_id": user_id,
        "poem_id": poem_id
    })

    if existing:
        likes_col.delete_one({"_id": existing["_id"]})
        views_col.update_one(
            {"who": user_id, "post_id": poem_id},
            {"$inc": {"score": -0.35}},
            upsert=True
        )

        poem = poems_col.find_one({"_id": poem_id})
        language = poem["analysis"]["language"]
        user_score = users_col.find_one({"_id": user_id})["preferences"]["languages"][language]
        updated_score = decrease_formula(user_score, 0.01)

        users_col.update_one(
            {"_id": user_id},
            {"$set": {f"preferences.languages.{language}": updated_score}}
        )

        current_user_emotions = users_col.find_one({"_id": user_id})["preferences"]["emotions"]
        new_user_emotions = update_emotions(current_user_emotions, poem, -0.40)

        users_col.update_one({"_id": user_id}, {
            "$set": {"preferences.emotions": new_user_emotions}
        })


        return jsonify({"message": "Like removed", "liked": False}), 200
    else:
        likes_col.insert_one({
            "user_id": user_id,
            "poem_id": poem_id,
            "saved_at": datetime.utcnow().isoformat() + "Z"
        })
        views_col.update_one(
            {"who": user_id, "post_id": poem_id},
            {"$inc": {"score": 0.35}},
            upsert=True
        )

        poem = poems_col.find_one({"_id": poem_id})
        language = poem["analysis"]["language"]
        user_score = users_col.find_one({"_id": user_id})["preferences"]["languages"][language]
        updated_score = growth_formula(user_score, 0.01)

        users_col.update_one(
            {"_id": user_id},
            {"$set": {f"preferences.languages.{language}": updated_score}}
        )

        current_user_emotions = users_col.find_one({"_id": user_id})["preferences"]["emotions"]
        new_user_emotions = update_emotions(current_user_emotions, poem, 0.35)

        users_col.update_one({"_id": user_id}, {
            "$set": {"preferences.emotions": new_user_emotions}
        })


        return jsonify({"message": "Like added", "liked": True}), 201


@app.route('/comments', methods=['POST'])
def add_comment():
    data = request.json
    poem_id = data.get("poem_id")
    user_id = data.get("user_id")
    content = data.get("content")

    if not poem_id or not user_id or not content:
        return jsonify({"error": "Missing poem_id, user_id, or content"}), 400

    comment = {
        "poem_id": poem_id,
        "user_id": user_id,
        "msg": content,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    current_user_emotions = users_col.find_one({"_id": user_id})["preferences"]["emotions"]
    poem = poems_col.find_one({"_id": poem_id})
    new_user_emotions = update_emotions(current_user_emotions, poem, 0.15)

    users_col.update_one({"_id": user_id}, {
        "$set": {"preferences.emotions": new_user_emotions}
    })


    view = views_col.find_one({"who": user_id, "post_id": poem_id})
    if (view and view.get("commented", 0) == 0) or not view:
        views_col.update_one(
            {"who": user_id, "post_id": poem_id},
            {
                "$inc": {"score": 0.15},
                "$set": {"commented": 1}
            },
            upsert=True
        )

    comments_col.insert_one(comment)
    return jsonify({"message": "Comment added successfully"}), 201

@app.route('/bookmarks/<int:user_id>', methods=['GET'])
def get_bookmarks(user_id):
    # Găsește toate bookmark-urile pentru user
    bookmarks = list(bookmarks_col.find({"user_id": user_id}))

    # Extrage poem_id-urile
    poem_ids = [b["poem_id"] for b in bookmarks]

    # Găsește toate poemele bookmark-ate
    poems = list(poems_col.find({"_id": {"$in": poem_ids}}))

    # Poemele trebuie convertite (MongoDB -> JSON)
    for poem in poems:
        poem["_id"] = poem["_id"]  # e int, nu trebuie conversie
        # poți adăuga aici și comentarii/like-uri dacă vrei

    return jsonify({"bookmarks": poems})


@app.route('/users/<username>', methods=['GET'])
def get_user_by_username(username):
    user = users_col.find_one({"username": username})
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Scoatem parola înainte de a trimite userul
    user_data = {
        "_id": user["_id"],
        "username": user["username"],
        "name": user["name"],
        "lastname": user["lastname"],
        "gender": user.get("gender", "unspecified"),
        "birthday": user["birthday"],
        "created_at": user["created_at"],
        "email": user["email"],
        "bio": user.get("bio", "")
    }

    return jsonify({"user": user_data}), 200


@app.route('/poems/user/<username>', methods=['GET'])
def get_poems_by_user(username):
    poems = list(
        poems_col.find({"user": username}).sort("posted_at", DESCENDING)
    )

    for poem in poems:
        poem["views"] = views_col.count_documents({"post_id": poem["_id"]})

    return jsonify({"poems": poems}), 200

def normalize_username(username):
    return re.sub(r'[^a-zA-Z0-9]', '', username.lower())

@app.route('/search/', methods=['POST'])
def search():
    data = request.json
    keyword = data.get("keyword", "").lower().strip()

    if not keyword:
        return jsonify({"error": "Missing keyword"}), 400

    # -------------------------------
    # USERS
    # -------------------------------
    users = list(users_col.find())
    matched_users = []

    for user in users:
        username = user["username"].lower()
        norm_username = normalize_username(user["username"])
        name = user.get("name", "").lower()
        lastname = user.get("lastname", "").lower()

        # Prioritate 1: username conține keyword
        if keyword in username:
            matched_users.append(user)
            continue

        # Prioritate 2: username normalizat conține keyword
        if keyword in norm_username:
            matched_users.append(user)
            continue

        # Prioritate 3: nume conține keyword
        if keyword in name:
            matched_users.append(user)
            continue

        # Prioritate 4: prenume conține keyword
        if keyword in lastname:
            matched_users.append(user)
            continue

    # Curățăm userii (fără parolă, id ca string)
    for u in matched_users:
        u.pop("password", None)

    # -------------------------------
    # POEMS
    # -------------------------------
    poems = list(poems_col.find({
        "$or": [
            {"title": {"$regex": keyword, "$options": "i"}},
            {"author": {"$regex": keyword, "$options": "i"}},
            {"content": {"$regex": keyword, "$options": "i"}},
        ]
    }).sort("posted_at", DESCENDING))

    for poem in poems:
        # Adăugăm număr de like-uri și salvări
        poem["likes_count"] = likes_col.count_documents({"poem_id": poem["_id"]})
        poem["saves_count"] = bookmarks_col.count_documents({"poem_id": poem["_id"]})
        poem["views"] = views_col.count_documents({"post_id": poem["_id"]})

    return jsonify({
        "users": matched_users,
        "poems": poems
    }), 200

@app.route('/poems/<int:poem_id>', methods=['DELETE'])
def delete_poem(poem_id):
    result = poems_col.delete_one({"_id": poem_id})
    if result.deleted_count == 1:
        bookmarks_col.delete_many({"poem_id": poem_id})
        views_col.delete_many({"post_id": poem_id})
        comments_col.delete_many({"poem_id": poem_id})
        likes_col.delete_many({"poem_id": poem_id})
        return jsonify({"message": "Poem deleted successfully."}), 200
    else:
        return jsonify({"error": "Poem not found."}), 404

@app.route('/users/<username>/bio', methods=['PUT'])
def update_user_bio(username):
    data = request.get_json()
    new_bio = data.get("bio", "").strip()

    if not new_bio:
        return jsonify({"error": "Bio cannot be empty."}), 400

    result = users_col.update_one(
        {"username": username},
        {"$set": {"bio": new_bio}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found."}), 404

    return jsonify({"message": "Bio updated successfully."}), 200

@app.route('/users/<int:user_id>/following', methods=['GET'])
def get_following(user_id):
    following = list(following_col.find({"who": user_id}))
    return jsonify({"following": following}), 200

@app.route('/users/<int:user_id>/followers', methods=['GET'])
def get_followers(user_id):
    followers = list(following_col.find({"whom": user_id}))
    return jsonify({"followers": followers}), 200

@app.route('/users/follow', methods=['POST'])
def follow_user():
    data = request.json
    who = data.get("who")
    whom = data.get("whom")

    if not who or not whom:
        return jsonify({"error": "Missing who or whom"}), 400

    last = following_col.find_one(sort=[("_id", -1)])
    max_id = last["_id"] if last else 0

    # Verificăm dacă deja există
    exists = following_col.find_one({"who": who, "whom": whom})
    if exists:
        return jsonify({"message": "Already following"}), 200

    following_col.insert_one({"_id": max_id+1, "who": who, "whom": whom, "created_at": datetime.utcnow().isoformat() + "Z"})
    return jsonify({"message": "Followed successfully"}), 201

@app.route('/users/unfollow', methods=['POST'])
def unfollow_user():
    data = request.json
    who = data.get("who")
    whom = data.get("whom")

    if not who or not whom:
        return jsonify({"error": "Missing who or whom"}), 400

    result = following_col.delete_one({"who": who, "whom": whom})
    if result.deleted_count == 0:
        return jsonify({"message": "Not following"}), 404

    return jsonify({"message": "Unfollowed successfully"}), 200

@app.route('/viewed', methods=['POST'])
def view_post():
    data = request.json
    who = data.get("who")
    post_id = data.get("post_id")
    
    if not who or not post_id:
        return jsonify({"error": "Missing data"}), 400
    
    exists = views_col.find_one({"who": who, "post_id": post_id})
    if exists:
        return jsonify({"message": "Already seen"}), 200

    views_col.insert_one({"who": who, "post_id": post_id, "viewed_at": datetime.utcnow().isoformat() + "Z", "score": 0.05})
    return jsonify({"message": "Viewed successfully"}), 201

@app.route('/poems', methods=['POST'])
def create_poem():
    data = request.json
    required_fields = ["title", "author", "created_at", "content", "user", "posted_at"]
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Calculăm un nou _id (asumăm că este întreg incremental)
    last_poem = poems_col.find_one(sort=[("_id", -1)])
    max_id = last_poem["_id"] if last_poem else 0

    analysis_result = analyze_poem(data["content"])

    new_poem = {
        "_id": max_id + 1,
        "title": data["title"],
        "author": data["author"],
        "created_at": data["created_at"],
        "content": data["content"],
        "user": data["user"],
        "posted_at": data["posted_at"],
        "analysis": analysis_result
    }

    poems_col.insert_one(new_poem)
    return jsonify({"message": "Poem posted successfully", "poem_id": new_poem["_id"]}), 201

def add_analysis_to_existing_poems():
    poems_without_analysis = poems_col.find({"analysis": {"$exists": False}})
    updated_count = 0

    for poem in poems_without_analysis:
        poem_id = poem["_id"]
        content = poem.get("content", "")
        
        if not content.strip():
            continue  # skip if no content

        try:
            analysis = analyze_poem(content)

            poems_col.update_one(
                {"_id": poem_id},
                {"$set": {"analysis": analysis}}
            )

            updated_count += 1
            print(f"✅ Updated poem _id={poem_id} with analysis.")

        except Exception as e:
            print(f"⚠️ Failed to analyze poem _id={poem_id}: {e}")

    print(f"🎉 Done. Updated {updated_count} poems with analysis.")

@app.route('/recommandation/<int:id>', methods=["GET"])
def recommandation(id):
    # 1. Caz fallback: utilizator invalid sau guest
    if id <= 0:
        user_activ = None
    else:
        user_activ = users_col.find_one({"_id": id})
        if not user_activ:
            return jsonify({"error": "User not found"}), 404

    # 2. Extragem toate datele brute din colecțiile MongoDB
    users = list(users_col.find())
    poems = list(poems_col.find())
    views = list(views_col.find())
    following = list(following_col.find())

    # 3. Apelăm algoritmul de recomandare
    rec = hybrid_recommendations(user_activ, users, views, poems, following)

    # 4. Prelucrăm fiecare poem cu info adițional (like-uri, comentarii, etc.)
    result = []
    for r in rec:
        poem = r["poem"]
        poem_id = poem["_id"]

        # Enrich poem
        poem["likes_count"] = likes_col.count_documents({"poem_id": poem_id})
        poem["saves_count"] = bookmarks_col.count_documents({"poem_id": poem_id})
        poem["views"] = views_col.count_documents({"post_id": poem_id})
        comments = list(comments_col.find({"poem_id": poem_id}))

        for comment in comments:
            user = users_col.find_one({"_id": comment['user_id']})
            if user:
                comment['username'] = user['username']

        poem["comments"] = comments
        poem["cb_score"] = r["score"]

        result.append(convert_ids(poem))

    return jsonify(result)



if __name__ == '__main__':
    app.run(debug=True)