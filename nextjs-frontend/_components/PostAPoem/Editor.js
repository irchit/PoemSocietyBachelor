"use client";
import React, {useState, useEffect} from "react";
import styles from "@/app/_styles/post_editor.module.css";
import { getUserFromCookie } from "@/app/_utils/cookies";

export default function Editor() {
    function formatDateToDDMMYYYY(dateStr) {
        const [year, month, day] = dateStr.split("-");
        return `${day}.${month}.${year}`;
    }

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [date, setDate] = useState(null);
    const [content, setContent] = useState("");

    const handleSubmit = async () => {
        if (title.length <= 0 && author.length <= 0 && !date && content <= 0){
            alert("Please fill out Poem content...");
            return;
        }
        const user = getUserFromCookie();
        if (!user){
            alert("Must be logged in... redirect to login...");
            window.location.href = "/login";
        }
        const new_post = JSON.stringify({
            title: title,
            author: author,
            created_at: formatDateToDDMMYYYY(date),
            content: content.replace(/\n\n/g, '§§').replace(/\n/g, '§'),
            user: user.username,
            posted_at: new Date().toISOString()
        })

        try {
        const res = await fetch("http://localhost:5000/poems", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: new_post
        });

        if (!res.ok) {
            const error = await res.json();
            alert("Error posting poem: " + (error.message || error.error));
            return;
        }
        window.location.href = "/" + user.username;

    } catch (err) {
        alert("Unexpected error: " + err.message);
    }
    }

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    Post new Poem
                </div>
                <div className={styles.information}>
                    <input type="text" onChange={(e) => {
                        setTitle(e.target.value);
                    }} placeholder="write title..."/>
                    <input type="text" onChange={(e) => {
                        setAuthor(e.target.value)
                    }} placeholder="write author" />
                    <div>
                        <label>Release Date: </label>
                        <input type="date" max={new Date().toISOString().split("T")[0]} onChange={(e) => {
                            setDate(e.target.value.toString())
                        }}/>
                    </div>
                </div>
                <div className={styles.actions}>
                    <button onClick={ () => {
                        alert("nu e gata...");
                        handleSubmit();
                    }}>Save</button>
                    <button onClick={() => {
                        window.location.href = "/";
                    }}>Cancel</button>
                </div>
            </div>
            <div className={styles.main_editor}>
                <h3>Poem content:</h3>
                <textarea placeholder="Write poem here..." onChange={(e) => {setContent(e.target.value)}}/>
            </div>
        </div>
    );
}