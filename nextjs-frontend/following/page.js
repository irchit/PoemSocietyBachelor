"use client";
import Menu from "../_components/Feed/Menu";
import PostsFollowing from "../_components/Feed/PostsFollowing";
import styles from "../page.module.css";
import Header from "../_components/Header";
import { useState } from "react";
import { useEffect } from "react";
import { getUserFromCookie } from "../_utils/cookies";

export default function Home() {

  const [user, setUser] = useState(null);
  useEffect(() => {
      const user = getUserFromCookie();
      if (user && user.id) {
          setUser(user);
      } else {
          setUser(null);
      }
  }, []);

  return (
    <div>
      <Header/>
      <div className={styles.main}>
        <Menu />
        <PostsFollowing />
      </div>
    </div>
  );
}
