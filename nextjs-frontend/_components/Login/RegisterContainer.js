"use client"
import React from "react";
import styles from "@/app/_styles/logincontainer.module.css";

// ✅ Setează cookie (3 zile)
function setSessionCookie(name, value, days = 3) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

export default function RegisterContainer() {

    const handleRegisterSwitch = () => {
        const loginBlock = document.getElementById("login");
        const registerBlock = document.getElementById("register");
        loginBlock.style.transition = "all 0.35s ease-in-out";
        registerBlock.style.transition = "all 0.25s ease-in-out";
        loginBlock.style.transform = "translateX(25vw)";
        registerBlock.style.transform = "translateX(50vw)";
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const form = e.target;

        if (["new_post", "poem", "search", "login", "bookmarks", "following"].some(x => x === form.username.value)){
            alert("Please choose another username!")
            return;
        }

        const isValid = /^[A-Za-z0-9._-]+$/.test(form.username.value);
        if (!isValid) {
            alert("Username can only contain letters, numbers, '.', '_' and '-'");
            return;
        }

        const payload = {
            username: form.username.value,
            password: form.password.value,
            name: form.name.value,
            lastname: form.lastname.value,
            email: form.email.value,
            gender: form.gender.value || "unspecified",
            birth: form.birth.value
        };

        // 🔄 1. Trimite cerere de înregistrare
        const res = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            window.location.reload();
        } else {
            alert(data.error);
        }
    };

    return (
        <div id="register" className={styles.loginContainer} style={{ transform: "translateX(50vw)" }}>
            <h1>Create a new account!</h1>
            <form className={styles.loginForm} onSubmit={handleRegister}>
                <div>
                    <input type="email" name="email" placeholder="Email" required />
                </div>
                <div>
                    <input type="text" name="username" placeholder="Username" required />
                </div>
                <div>
                    <input type="password" name="password" placeholder="Password" required />
                </div>
                <div>
                    <input type="text" name="name" placeholder="First Name" required />
                </div>
                <div>
                    <input type="text" name="lastname" placeholder="Last Name" required />
                </div>
                <div>
                    <label htmlFor="birth">Date of Birth:</label>
                    <input type="date" name="birth" required />
                </div>
                <div>
                    <label htmlFor="gender">Gender:</label>
                    <select name="gender" required>
                        <option value="unspecified">Unspecified</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
                <div>
                    <input type="checkbox" name="agree" required />
                    <label htmlFor="agree">I agree to the <a>terms and conditions</a></label>
                </div>
                <div className={styles.buttonContainer}>
                    <button className={styles.button} type="submit">Register</button>
                </div>
            </form>
            <p>Already have an account? <span onClick={handleRegisterSwitch}>Log in here!</span></p>
        </div>
    );
}
