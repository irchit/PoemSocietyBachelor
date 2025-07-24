import React from "react";
import styles from "@/app/_styles/feed.module.css"

export default function Mess({from, seen, when}){

    return (
        <div className={styles.mess}>
            <p>{from}</p>
            <p>{seen ? "" : "💠"} {when}</p>
        </div>
    )

}