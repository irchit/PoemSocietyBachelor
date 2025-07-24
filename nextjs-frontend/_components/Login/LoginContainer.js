"use client"
import React, { useEffect } from "react";
import { getCookie, setSessionCookie } from "@/app/_utils/cookies";
import styles from "@/app/_styles/logincontainer.module.css";

export default function LoginContainer() {

    const handleRegister = () => {
        const loginBlock = document.getElementById("login");
        const registerBlock = document.getElementById("register");
        registerBlock.style.transition = "all 0.35s ease-in-out";
        loginBlock.style.transition = "all 0.25s ease-in-out";
        loginBlock.style.transform = "translateX(-50vw)";
        registerBlock.style.transform = "translateX(-25vw)";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (res.ok) {
            setSessionCookie(data);
            alert(`Welcome ${data.name}`);
            window.location.href = "/"; // sau navigate
        } else {
            alert(data.error);
        }
    };

    // ✅ Verificare dacă user este deja logat
    useEffect(() => {
        const user = getCookie("user");
        if (user) {
            console.log("Already logged in:", user);
        }
    }, []);

    return (
        <div id="login" className={styles.loginContainer} style={{ transform: "translateX(25vw)" }}>
            <h1>Log In</h1>
            <form className={styles.loginForm} onSubmit={handleLogin}>
                <div>
                    <input type="text" name="username" placeholder="Username" required />
                </div>
                <div>
                    <input type="password" name="password" placeholder="Password" required />
                </div>
                <div className={styles.buttonContainer}>
                    <button className={styles.button} type="submit">Log In</button>
                </div>
            </form>
            <p>
                Do you want to start writing? <span onClick={handleRegister}>Create an account now!</span><br /><br />
                Did you forget your password? <span onClick={() => { console.log("forgot password") }}>Reset your password</span>
            </p>
        </div>
    );
}
