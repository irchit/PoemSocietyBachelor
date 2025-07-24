"use client";
import Image from "next/image";
import styles from "../page.module.css";
import Header from "../_components/Header";
import { useState } from "react";
import { useEffect } from "react";
import { getUserFromCookie } from "../_utils/cookies";
import Bookmarks from "../_components/Bookmarks/Bookmarks";

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
      <div className={styles.main} style={{overflow: "hidden"}}>
        { user ?  
          <Bookmarks />
        : 
          <div 
            style={
              { 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "50vh", 
                width: "70vw",
                backgroundColor: "rgba(13, 61, 19, 0.8)",
                color: "white",
                borderRadius: "25px",
                fontFamily: "QuickSand, sans-serif"
              }
            }
          >
            <h2>
              Please log in or register to access your bookmarks.
            </h2>
            <a href="\login">login here</a>
          </div>
        }
      </div>
    </div>
  );
}
