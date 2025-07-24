"use client";
import Image from "next/image";
import styles from "../page.module.css";
import Header from "../_components/Header";
import { useState } from "react";
import { useEffect } from "react";
import { getUserFromCookie } from "../_utils/cookies";
import Bookmarks from "../_components/Bookmarks/Bookmarks";
import SearchPage from "../_components/SearchPage/SearchPage";

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
      <SearchPage user={user}/>
    </div>
  );
}
