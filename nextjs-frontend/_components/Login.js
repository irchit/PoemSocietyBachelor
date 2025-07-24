"use client"
import { getCookie, removeCookie, getUserFromCookie } from "@/app/_utils/cookies";
import React, { useEffect, useState } from "react";
import styles from "@/app/_styles/header.module.css"

export default function Login (){
    const [user, setUser] = useState(null);

    useEffect(() => {
        const cookieUser = getUserFromCookie("user");
        setUser(cookieUser);
    }, []);

    const handleLogout = () => {
        removeCookie("user");
        window.location.reload();
    };

    return (
        <button className={styles.login} onClick={() => {
            if (!user) {
                window.location.href = "/login";
            } else {
                window.location.href = "/" + user.username;
            }
        }}>
            {user ? <p>{user.username} | {user.name + " " + user.lastname}</p> : 
            <p>
                Log In | Register
            </p>
            }
        </button>
    )
}