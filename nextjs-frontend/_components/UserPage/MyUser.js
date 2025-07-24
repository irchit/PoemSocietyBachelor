"use client";
import React, { useEffect, useState } from "react";
import styles from "@/app/_styles/userpage.module.css"
import styleslogin from "@/app/_styles/logincontainer.module.css";
import styles_from_feed from "@/app/_styles/feed.module.css";
import { getUserFromCookie } from "@/app/_utils/cookies";
import { setViewsCount } from "@/app/_utils/views";

export default function MyUser ({user}) {
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState(user.bio || "");
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

    const editBio = () => {
        setNewBio(user.bio || "");
        setIsEditingBio(true);
    };

    const cancelEdit = () => {
        setIsEditingBio(false);
        setNewBio("");
    }

    const handleBioChange = (e) => {
        setNewBio(e.target.value);
    }

    const handleBioSubmit = async (e) => {
        e.preventDefault();
        if (newBio.trim() === "") {
            alert("Bio cannot be empty.");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/users/${user.username}/bio`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ bio: newBio })
            });

            if (!res.ok) {
                const error = await res.json();
                alert("Error updating bio: " + (error.message || error.error));
                setNewBio(user.bio || "");
                setIsEditingBio(false);
                return;
            }

            setIsEditingBio(false);
            user.bio = newBio;
            setNewBio("");
        } catch (err) {
            alert("An unexpected error occurred: " + err.message);
        }
    }

    const handleDelete = async (poem) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this poem (${poem.title})?`);
    if (!confirmDelete) {
        console.log("Cancelled.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/poems/${poem._id}`, {
        method: "DELETE"
        });

        if (res.ok) {
        setPoems(prev => prev.filter(p => p._id !== poem._id));
        } else {
        const error = await res.json();
        alert("Error: " + (error.message || error.error));
        }
    } catch (err) {
        alert("An unexpected error occurred: " + err.message);
    }
};



    function formatTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
}

    const [poems, setPoems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const yearsOld = (birthday) => {
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    const fetxchFollowersAndFollowing = async () => {
        console.log(user);
            try {
                const res = await fetch(`http://localhost:5000/users/${user._id}/followers`);
                if (!res.ok) throw new Error("Failed to fetch followers");
                const data = await res.json();
                setFollowers(data.followers);
            } catch (err) {
                console.error("Error fetching followers:", err);
            }

            try {
                const res = await fetch(`http://localhost:5000/users/${user._id}/following`);
                if (!res.ok) throw new Error("Failed to fetch following");
                const data = await res.json();
                setFollowing(data.following);
            } catch (err) {
                console.error("Error fetching following:", err);
            }
        }

    useEffect(() => {
        const fetchPoems = async () => {
            try {
                const res = await fetch(`http://localhost:5000/poems/user/${user.username}`);
                if (!res.ok) throw new Error("Failed to fetch poems");
                const data = await res.json();
                setPoems(data.poems);
            } catch (err) {
                console.error("Error fetching poems:", err);
            } finally {
                setLoading(false);
            }
        };
        fetxchFollowersAndFollowing();
        fetchPoems();
    }, [user.username]);



    return (
        <div className={styles.container}>
            <div className={styles.user_info}>
                <div className={styles.user_header}>
                    <h1>{user.username}</h1>
                    <h3>{user.name + " " + user.lastname}</h3>
                    <div style={{display: "flex", flexDirection: "column"}}>
                        <p>{yearsOld(user.birthday)}yo</p>
                        <p>{followers.length} followers | {following.length} following</p>
                    </div>
                </div>
                <div style={{height: "5vh"}}></div>
                <div className={styles.user_bio}>
                    <h2>My Bio:</h2>

                    {
                        isEditingBio ? (
                            <textarea
                                value={
                                    newBio
                                }
                                onChange={handleBioChange}
                                placeholder="Write your bio here..."
                                style={{width: "80%", height: "70%", padding: "10px", fontSize: "2vh", alignSelf: "center"}}
                                maxLength={255}
                            />
                         ) : ( 
                             user.bio && user.bio.length > 0 ? (
                                 <p>{user.bio}</p>
                             ) : (
                                 <p>No bio available...</p>
                             )
                         )
                    }

                    {
                    }
                </div>
                <div className={styles.user_actions}>
                    <div>

                        {
                            isEditingBio ? (
                                <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                                    <button style={{marginBottom: "5px"}} className={styleslogin.button} onClick={cancelEdit}>
                                        Cancel
                                    </button>
                                    <button className={styleslogin.button} onClick={handleBioSubmit}>
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <button className={styleslogin.button} onClick={editBio}>
                                    Edit Bio
                                </button>

                            )
                        }
                    </div>
                    <span>|</span>
                    <p>{poems.length > 0 ? poems.length : "No"} poem{poems.length > 1 ? "s" : ""} posted</p>
                </div>
            </div>
            <div className={styles.user_poems}>
                <h3><span style={{textDecoration: "underline"}}>My Posted Poems</span> | <a style={{textDecoration: "none"}} href="/">Feed</a> | <a style={{textDecoration: "none"}} href="/bookmarks">My Bookmarks</a> | <a style={{textDecoration: "none"}} href="/new_post">Post a new poem</a></h3>
                {
                    loading ? (
                        <div className={styles.loading}>Loading poems...</div>
                    ) : (
                        poems.length > 0 ? (
                            <div className={styles.poem_view}>
                                <div className={styles.poem_list}>
                                    {poems.slice(currentIndex, currentIndex + 4).map((bookmark, index) => (
                                    <div key={index} className={styles.bookmark_item}>
                                        <span style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start"}}>
                                            <h3 style={{margin: "0"}}>{bookmark.title} | {setViewsCount(bookmark.views)} 👁️</h3>
                                            <p style={{margin: "0"}}>by {bookmark.author}</p>
                                        </span>
                                        <p>posted {formatTimeAgo(bookmark.posted_at)}</p>
                                        <button className={styles.button_view} onClick={() => {
                                            window.location.href = `/poem/${bookmark._id}`;
                                        }}>View Poem</button>
                                        <button title="delete poem" onClick={() => {
                                            handleDelete(bookmark)
                                        }}
                                        style={
                                            {
                                                cursor: "pointer"
                                            }
                                        }>🗑️</button>
                                </div>
                            ))}
                                </div>
                                <div className={styles.poem_controller}>
                                <button 
                                onClick={() => {
                                    setCurrentIndex(currentIndex - 4 < 0 ? 0 : currentIndex - 4);
                                }
                                }
                                className={styles_from_feed.button_next_page} disabled={currentIndex===0}>↑</button>
                                <button 
                                onClick={() => {
                                    setCurrentIndex(currentIndex + 4 >= poems.length ? currentIndex : currentIndex + 4);
                                }
                                }
                                className={styles_from_feed.button_next_page} disabled={currentIndex + 4 >= poems.length}>↓</button>
                                </div>
                            </div>
                        ) : (
                            <p>No poems posted yet.</p>
                        )
                    )
                }
            </div>
        </div>
    )
}