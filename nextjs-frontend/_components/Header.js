"use client";
import React, { useEffect, useState } from "react";
import styles from "@/app/_styles/header.module.css"
import Login from "./Login";

export default function Header () {
    return (
        <div className={styles.container}>
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div className={styles.logo}>
                <h1 className={styles.title}>PoemSociety ♡</h1>
                <p className={styles.subtitle}>Write, Read, Love!</p>
            </div>
            </a>
            <Login/>
        </div>
    )
}