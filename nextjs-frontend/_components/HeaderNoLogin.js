"use client";
import { getCookie, removeCookie } from "@/app/_utils/cookies";
import React, { useEffect, useState } from "react";
import styles from "@/app/_styles/header.module.css";

export default function HeaderNoLogin() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const cookieUser = getCookie("user");
        setUser(cookieUser);
    }, []);

    const handleLogout = () => {
        removeCookie("user");
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <div className={styles.logo}>
                    <h1 className={styles.title}>PoemSociety ♡</h1>
                    <p className={styles.subtitle}>Write, Read, Love!</p>
                </div>
            </a>
                <button className={styles.login} onClick={() => {
                    window.location.href = "/search";}}>
                    <p>Search 🔎</p>
                </button>

            {user ? (
                <button className={styles.login} onClick={handleLogout}>
                    <p>Log Out</p>
                </button>
            ) : (
                <button className={styles.login} onClick={() => {
                    window.location.href = "/login";}}>
                    <p>Log In</p>
                </button>
            )}
        </div>
    );
}
