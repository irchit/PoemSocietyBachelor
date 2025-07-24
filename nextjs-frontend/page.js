"use client";
import Image from "next/image";
import styles from "./page.module.css";
import Header from "./_components/Header";
import Menu from "./_components/Feed/Menu";
import Posts from "./_components/Feed/Posts";

export default function Home() {
  return (
    <div>
      <Header/>
      <div className={styles.main} style={{gap: "1.5vw"}}>
        <Menu />
        <Posts />
      </div>
    </div>
  );
}
