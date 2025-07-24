'use client';
import React, { useState, useEffect } from "react";
import styles from "@/app/_styles/feed.module.css";
import Post from "./Post";
import { getUserFromCookie } from "@/app/_utils/cookies";

export default function Posts() {
    const [feed, setFeed] = useState([]);
    const [currentPoem, setCurrentPoem] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(0);
    const [isAlert, setAlert] = useState(true);

    useEffect(() => {
        const user = getUserFromCookie();
        if (user && user.id) {
            setUserId(user.id);
            fetchRecommendedPoems(user.id);
            setAlert(false);
        } else {
            fetchRecommendedPoems(userId);
            setLoading(false);
        }
    }, []);

    const fetchRecommendedPoems = async (id) => {
    try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/recommandation/${id}`);

        if (!res.ok) {
            const text = await res.text(); // pentru debug
            throw new Error(`Server error ${res.status}: ${text}`);
        }

        const data = await res.json();
        const newPoems = data;
        setFeed(prev => [...prev, ...newPoems]);

    } catch (err) {
        console.error("Failed to fetch recommended poems:", err);
    } finally {
        setLoading(false);
    }
};


    const prevPoem = () => {
        if (currentPoem > 0) {
            setCurrentPoem(currentPoem - 1);
        }
    };

    const nextPoem = () => {
        const next = currentPoem + 1;

        if (userId >= 0 && next % 10 === 7) {
            fetchRecommendedPoems(userId);
        }

        if (next < feed.length) {
            setCurrentPoem(next);
        }
    };

    if (loading && feed.length === 0) return <div>Loading poems...</div>;
    if (feed.length === 0) return <div>No poems found.</div>;

    return (
        <>
        <div className={styles.posts}>
            <Post poem={feed[currentPoem]} />
            <div className={styles.actions}>
                <button
                    disabled={currentPoem === 0}
                    className={styles.button_next_page}
                    onClick={prevPoem}
                    >
                    ↑
                </button>
                <button
                    disabled={currentPoem === feed.length - 1}
                    className={styles.button_next_page}
                    onClick={nextPoem}
                    >
                    ↓
                </button>
            </div>
        </div>
        {userId == 0 && isAlert && <p 
            onClick={() => {setAlert(false)}}
            style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                padding: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.65)",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer",
                fontFamily: "Quicksand, sans-serif",
                textAlign: "center"
            }}
        >Alert: If not logged in, poems shown random...<br/>Click on me to close!</p>}
        </>
    );
}
