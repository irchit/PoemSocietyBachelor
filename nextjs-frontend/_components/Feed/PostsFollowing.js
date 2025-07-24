'use client'
import React, { useState, useEffect } from "react";
import styles from "@/app/_styles/feed.module.css"
import Post from "./Post";
import { getUserFromCookie } from "@/app/_utils/cookies";

export default function Posts() {
    const [feed, setFeed] = useState([]);
    const [currentPoem, setCurrentPoem] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = getUserFromCookie();
        if (!user || !user.id) {
            alert("You must be logged in to view this page.");
            window.location.href = "/login";
            return;
        }
        fetch(`http://localhost:5000/poems/following/${user.id}`)  // ← asigură-te că CORS e activ pe Flask
            .then(res => res.json())
            .then(data => {
                setFeed(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch poems:", err);
                setLoading(false);
            });
    }, []);

    const prevPoem = () => {
        if (currentPoem > 0)
            setCurrentPoem(currentPoem - 1);
        else
            console.log("refresh");
    };

    const nextPoem = () => {
        if (currentPoem < feed.length - 1) {
            setCurrentPoem(currentPoem + 1);
            console.log("fetch 5 new post from db...");
        }
    };

    if (loading) return <div>Loading poems...</div>;
    return (
        feed.length > 0 ? (
            <div className={styles.posts}>
                <Post poem={feed[currentPoem]} />
                <div className={styles.actions}>
                    <button disabled={currentPoem === 0} className={styles.button_next_page} onClick={prevPoem}>↑</button>
                    <button disabled={currentPoem === feed.length - 1} className={styles.button_next_page} onClick={nextPoem}>↓</button>
                </div>
            </div> 
        ) : (
            <div className={styles.posts}>
                <h2>No posts from users you follow.</h2>
                <p>Start following users to see their posts here.</p>
                <div style={{ textAlign: "center", width: "50%", margin: "20px", padding: "10px", backgroundColor: "rgba(20, 89, 29, 0.7)", borderRadius: "25px" }}>
                    <p><a href="/">Go home...</a></p>
                </div>
            </div>
        )
    );
}
