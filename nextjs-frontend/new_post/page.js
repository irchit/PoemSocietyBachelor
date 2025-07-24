"use client";
import Header from "../_components/Header";
import { useState } from "react";
import { useEffect } from "react";
import { getUserFromCookie } from "../_utils/cookies";
import Editor from "../_components/PostAPoem/Editor";

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
      { user ?  <Editor /> : <p>Go Home...</p>}
    </div>
  );
}
