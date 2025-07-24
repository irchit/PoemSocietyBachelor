import React from "react";
import styles from "@/app/_styles/feed.module.css"

export default function Menu() {

    function openBookmarks() {
        window.location.href = "/bookmarks";
    }
    function openFollowing() {
        window.location.href = "/following";
    }

    function openSearch() {
        window.location.href = "/search";
    }

    return (
        <div className={styles.menu_container}>
            <h3 onClick={() => {window.location.href = "/"}}>Feed 🌐</h3>
            <h3 onClick={openFollowing}>Following 🫂</h3>
            <h3 onClick={openBookmarks}>Bookmarks 📕</h3>
            <h3 onClick={openSearch}>Search 🔎</h3>
            <h3 onClick={() => {window.location.href = "/new_post"}}>Post a Poem ➕</h3>
        </div>
    )

}