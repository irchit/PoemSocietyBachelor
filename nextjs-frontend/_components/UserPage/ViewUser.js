"use client";
import React, { useEffect, useState } from "react";
import styles from "@/app/_styles/userpage.module.css"
import styleslogin from "@/app/_styles/logincontainer.module.css";
import styles_from_feed from "@/app/_styles/feed.module.css";
import { getUserFromCookie } from "@/app/_utils/cookies";
import { setViewsCount } from "@/app/_utils/views";

export default function ViewUser ({user}) {

    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [isFollowed, setIsFollowed] = useState(false);

    const toggleFollowUnFollow = async () => {
        const currentUser = getUserFromCookie();
        if (!currentUser){
            alert("You must be logged in... redirecting to login!");
            window.location.href = "/login";
        }
        if (followers){
            if (isFollowed) {
                try {
                    const res = await fetch(`http://localhost:5000/users/unfollow`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${currentUser.token}`
                        },
                        body: JSON.stringify({ who: currentUser.id, whom: user._id })
                    });
                    if (!res.ok) throw new Error("Failed to unfollow");
                    fetxchFollowersAndFollowing();
                } catch (err) {
                    console.error("Error unfollowing:", err);
                }
            } else {
                try{
                    const res = await fetch("http://localhost:5000/users/follow", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${currentUser.token}`
                        },
                        body: JSON.stringify({ who: currentUser.id, whom: user._id })
                    });
                    if (!res.ok) throw new Error("Failed to unfollow");
                    fetxchFollowersAndFollowing();
                } catch (err) {
                    console.error("Error unfollowing:", err);
                }
            }
        }
    }

    const fetxchFollowersAndFollowing = async () => {
            try {
                const res = await fetch(`http://localhost:5000/users/${user._id}/followers`);
                if (!res.ok) throw new Error("Failed to fetch followers");
                const data = await res.json();
                setFollowers(data.followers);
                const currentUser = getUserFromCookie();
                if (!currentUser || !currentUser.id) {
                    setIsFollowed(false);
                } else {
                    setIsFollowed(data.followers.some(follower => follower.who === currentUser.id));
                }
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

    }, [user]);

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
                        user.bio ? (
                            <p>{user.bio}</p>
                        ) : (
                            <p>No bio available...</p>
                        )
                    }
                </div>
                <div className={styles.user_actions}>
                    <div>
                        <button
                            onClick={() => {
                                toggleFollowUnFollow();
                            }}
                        className={styleslogin.button}>  {isFollowed ? "Unfollow" : "Follow"} </button>
                    </div>
                    <span>|</span>
                    <p>{poems.length > 0 ? poems.length : "No"} poem{poems.length > 1 ? "s" : ""} posted</p>
                </div>
            </div>
            <div className={styles.user_poems}>
                <h3>Posted Poems</h3>
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