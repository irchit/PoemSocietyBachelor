"use client";
import React, { useState, useEffect } from "react";
import styles from "../../page.module.css";
import Header from "../../_components/Header";
import Post from "@/app/_components/Feed/Post";
import { useParams } from "next/navigation";

export default function Home() {
  const params = useParams();
  const id = params.id;

  const [poem, setPoem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/poems/${id}`)
      .then(res => res.json())
      .then(data => {
        setPoem(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch poem:", err);
        setLoading(false);
      });
  }, [id]);

  return (
    <div>
      <Header />
      <div className={styles.main}>
        {loading ? (
          <p>Loading poem...</p>
        ) : poem && poem.content ? (
            <Post poem={poem} />
        ) : (
          <p>Poem not found or invalid data.</p>
        )}
      </div>
    </div>
  );
}
