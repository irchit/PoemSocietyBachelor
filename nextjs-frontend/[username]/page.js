"use client";
import React, { useState, useEffect, use } from "react";
import styles from "../page.module.css";
import { useParams } from "next/navigation";
import { getUserFromCookie } from "../_utils/cookies";
import MyUser from "../_components/UserPage/MyUser";
import HeaderNoLogin from "../_components/HeaderNoLogin";
import ViewUser from "../_components/UserPage/ViewUser";

export default function Home() {

  const params = useParams();
  const username = params.username;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [thisUser, setThisUser] = useState(null);

  useEffect(() => {

    const _thisUser = getUserFromCookie();
    if (_thisUser && _thisUser.id) {
      setThisUser(_thisUser);
      if (thisUser && thisUser.username === username) {
        setUser(thisUser);
        setLoading(false);
        return;
      }
    }
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:5000/users/${username}`);
        if (!res.ok) throw new Error("User not found");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        alert("User not found");
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

  }, []);

  return (
    <div>
      <HeaderNoLogin />
      <div className={styles.main}>
        {
          loading ? (
            <div className={styles.loading}>Loading user...</div>
          ) : user ? user.username === (thisUser && thisUser.username) ? (<MyUser user={user}/>) : (<ViewUser user={user} />) : (    
            <div className={styles.loading}>User not found</div>
          )
        }
      </div>
    </div>
  );
}
