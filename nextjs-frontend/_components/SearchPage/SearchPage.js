"use client";
import React, { useState, useEffect } from "react";
import styles from "@/app/_styles/search.module.css";
import styles_from_feed from "@/app/_styles/feed.module.css";
import styles_bookmarks from "@/app/_styles/bookmarks.module.css";
import { getUserFromCookie } from "@/app/_utils/cookies";
import { setViewsCount, getFlagEmoji } from "@/app/_utils/views";
import LanguageFlag from "../LanguageFlags";
export default function SearchPage({user}) {

    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);  
    const [results, setResults] = useState({ users: [], poems: [] });
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [currentPoemIndex, setCurrentPoemIndex] = useState(0);
    const usersPerPage = 6;
    const poemsPerPage = 4;

  const handleSearch = async (query) => {
    if (!query || query.trim() === "") {
      setResults({ users: [], poems: [] });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/search/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query })
      });

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.search_container}>
      <div className={styles.search_bar}>
        <h1>Search Page</h1>
        <input
          type="text"
          placeholder="Search for poems, authors, or topics..."
          className={styles.search_input}
          onChange={(event) => {
            const query = event.target.value;
            setSearchQuery(query);
            handleSearch(query);
            setCurrentPoemIndex(0);
            setCurrentUserIndex(0);
          }}
        />
      </div>
            <div className={styles.results_container}>
                <div className={styles.results_users}>
                    <h3>Found users:</h3>
                    <div className={styles.results_users_list}>
                        {
                            searchQuery != "" ? 
                            (
                                isLoading ?
                            <p style={{height: "55vh"}}>Loading...</p> : 
                                ( 
                                  <div className={styles.results_users_list}>{

                                    results.users.length > 0 ?
                                    results.users.slice(currentUserIndex, currentUserIndex + usersPerPage).map((user, index) => (
                                        <div key={index} className={styles.user_item}>
                                                        <p>
                                                            <a href={`/${user.username}`}>
                                                                @{user.username}
                                                            </a>
                                                        </p>
                                                        <button onClick={() => {window.location.href = "/" + user.username}} className={styles.button_view_fllw}>
                                                            check user
                                                        </button>
                                                    </div>
                                                )) : <p style={{height: "100%"}}>No user found...</p>
                                            } 
                                    </div>
                                )
                            ) 
                            : 
                            (
                            <p style={{height: "55vh"}}>
                                Search for users to see results here...
                            </p>
                            )
                        }
                                    <div className={styles.results_users_controller}>
                                        <button 
                                onClick={() => {
                                    setCurrentUserIndex(currentUserIndex - 6 < 0 ? 0 : currentUserIndex - 6);
                                }
                                }
                            className={styles_from_feed.button_next_page} disabled={currentUserIndex===0}>↑</button>
                            <button 
                                onClick={() => {
                                    setCurrentUserIndex(currentUserIndex + 6 >= results.users.length ? currentUserIndex : currentUserIndex + 6);
                                }
                                }
                            className={styles_from_feed.button_next_page} disabled={currentUserIndex + 6 >= results.users.length}>↓</button>
                                    </div>
                   </div>
                </div>
                <div className={styles.results_poems}>
                    <div className={styles.results_poems_list}>
                        <p>Results</p>
                        <div style={{width: "100%", height: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between"}}>
                            {
                                searchQuery != "" ? 
                                (
                                    isLoading ? (
                                    <p style={{height: "50vh"}}>Loading...</p> ) :  
                                        <div style={{width: "100%", height: "50vh", display: "flex", flexDirection: "column", alignItems: "center"}}>
                                        {
                                            results.poems.length > 0 ?
                                            results.poems.slice(currentPoemIndex, currentPoemIndex + poemsPerPage).map((poem, index) => (
                                                <div key={index} className={styles.poem_item}>
                                                    <div className={styles.poem_title}>
                                                        <h3>{poem.title}</h3>
                                                        <p>by {poem.author}</p>
                                                    </div>
                                                    <div className={styles.poem_actions}>
                                                        <p>{poem.likes_count}🤍</p>
                                                        <p>{poem.saves_count}📑</p>
                                                        <p>{setViewsCount(poem.views)}👁️</p>
                                                        <p><LanguageFlag code={poem.analysis.language} /></p>
                                                        <button className={styles_bookmarks.button_view} onClick={() => {
                                                            window.location.href = `/poem/${poem._id}`;
                                                        }}>View Poem</button>
                                                    </div>
                                                </div>
                                            )) : <p style={{height: "100%"}}>No poem found...</p>
                                        }
                                        </div> 
                                                                          
                                ) 
                                : 
                                (
                                    <p style={{height: "50vh"}}>
                                        Search for poems to see results here...
                                    </p>
                                )
                            }
                            <div className={styles.results_users_controller}>
                            <button
                                onClick={() => {
                                    setCurrentPoemIndex(currentPoemIndex - 4 < 0 ? 0 : currentPoemIndex - 4);
                                }}
                                className={styles_from_feed.button_next_page} disabled={currentPoemIndex===0}>↑</button>
                            <button
                                onClick={() => {
                                    setCurrentPoemIndex(currentPoemIndex + 4 >= results.poems.length ? currentPoemIndex : currentPoemIndex + 4);
                                }}
                                className={styles_from_feed.button_next_page} disabled={currentPoemIndex + 4 >= results.poems.length}>↓</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}