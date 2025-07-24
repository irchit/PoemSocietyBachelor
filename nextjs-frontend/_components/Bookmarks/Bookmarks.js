"use client";
import React, { useEffect, useState } from "react";
import styles from "@/app/_styles/bookmarks.module.css";
import styles_from_feed from "@/app/_styles/feed.module.css";
import { getUserFromCookie } from "@/app/_utils/cookies";

export default function Bookmarks() {

    const [bookmarks, setBookmarks] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const user = getUserFromCookie();
        if (!user || !user.id) return;

        const fetchBookmarks = async () => {
            try {
                const res = await fetch(`http://localhost:5000/bookmarks/${user.id}`);
                const data = await res.json();
                setBookmarks(data.bookmarks);
            } catch (err) {
                console.error("Error fetching bookmarks:", err);
            }
        };

        fetchBookmarks();
    }, []);

    return (
        <div className={styles.bookmarks_container}>
            <h1>Bookmarks</h1>
                {bookmarks.length > 0 ? (

                    <div className={styles.bookmarks_view}>
                        <div className={styles.bookmarks_list}>
                            {bookmarks.slice(currentIndex, currentIndex + 5).map((bookmark, index) => (
                                <div key={index} className={styles.bookmark_item}>
                                    <span style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start"}}>
                                        <h3 style={{margin: "0"}}>{bookmark.title}</h3>
                                        <p style={{margin: "0"}}>by {bookmark.author}</p>
                                    </span>
                                    <p>posted by {bookmark.user}</p>
                                    <button className={styles.button_view} onClick={() => {
                                        window.location.href = `/poem/${bookmark._id}`;
                                    }}>View Poem</button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.bookmarks_controller}>
                            <button 
                                onClick={() => {
                                    setCurrentIndex(currentIndex - 5 < 0 ? 0 : currentIndex - 5);
                                }
                                }
                            className={styles_from_feed.button_next_page} disabled={currentIndex===0}>↑</button>
                            <button 
                                onClick={() => {
                                    setCurrentIndex(currentIndex + 5 >= bookmarks.length ? currentIndex : currentIndex + 5);
                                }
                                }
                            className={styles_from_feed.button_next_page} disabled={currentIndex + 5 >= bookmarks.length}>↓</button>
                        </div>
                    </div>

                ) : (
                    <div>
                        <p>No bookmarks found.</p>
                        <p>Go read some poetry <a href="/">on the feed</a>.</p>
                    </div>
                )}
            </div>
    );


}