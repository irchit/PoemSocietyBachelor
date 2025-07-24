"use client";
import React, { useEffect } from "react";
import { getUserFromCookie } from "../_utils/cookies";
import Image from "next/image";
import styles from "../page.module.css";
import HeaderNoLogin from "../_components/HeaderNoLogin";
import LoginContainer from "../_components/Login/LoginContainer";
import RegisterContainer from "../_components/Login/RegisterContainer";

export default function Home() {

  // if logged in, redirect to /username
  useEffect(() => {
    const user = getUserFromCookie();
    if (user) {
      window.location.href = `/${user.username}`;
    }
  }, []);

  return (
    <div>
      <HeaderNoLogin/>
      <div className={styles.main} style={{overflow: "hidden"}}>
        <LoginContainer />
        <RegisterContainer />
      </div>
    </div>
  );
}
