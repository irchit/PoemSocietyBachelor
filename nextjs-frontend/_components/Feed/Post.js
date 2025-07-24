"use client";
import React, { useEffect, useState } from "react";
import styles from "@/app/_styles/feed.module.css";
import { getUserFromCookie } from "@/app/_utils/cookies";

export default function Post({poem}) {  

  //poem.comments = poem.comments sort by created_at desc
  poem.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const [comment, setComment] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewComments, setViewComments] = useState(false);
  const pages = [];

  function formatTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
}

const [is_bookmarked, setBookmark] = useState(null);
const [is_liked, setLiked] = useState(null);

useEffect(() => {
  if (!poem || !poem._id) return;

  const user = getUserFromCookie();
  if (!user || !user.id) return;

  const checkBookmark = async () => {
    try {
      const res = await fetch(`http://localhost:5000/bookmarks/check/${poem._id}/by/${user.id}`);
      const data = await res.json();
      setBookmark(data.bookmarked);
    } catch (err) {
      console.error("Error checking bookmark:", err);
    }
  };
  const checkLikes = async () => {
    try {
      const res = await fetch(`http://localhost:5000/likes/check/${poem._id}/by/${user.id}`);
      const data = await res.json();
      setLiked(data.liked);
    } catch (err) {
      console.error("Error checking likes:", err);
    }
  };

  checkBookmark();
  checkLikes();
}, [poem]);

useEffect(() => {
  const user = getUserFromCookie();
  if (!user || !user.id || !poem || !poem._id) return;

  const sendView = async () => {
    try {
      const res = await fetch("http://localhost:5000/viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          who: user.id,
          post_id: poem._id
        })
      });
      const result = await res.json();
      console.log("View result:", result.message);
    } catch (err) {
      console.error("Failed to send view:", err);
    }
  };

  sendView();
}, [poem]);




  const submitComment = async () => {
  const user = getUserFromCookie(); // asigură-te că ai asta implementat

  if (!user || !user.id) {
    alert("You must be logged in to comment.");
    return;
  }

  if (!poem || !poem._id || !comment.trim()) {
    alert("Complete all fields");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poem_id: poem._id,
        user_id: user.id,
        content: comment
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log("Comment added!");
      setComment("");
      // TODO: eventual update la lista de comentarii
      poem.comments.push({
        peom_id: poem._id,
        user_id: user.id,
        username: user.username,
        msg: comment,
        created_at: new Date().toISOString()
      });
    } else {
      console.error("Error:", result.error);
    }
  } catch (err) {
    console.error("Server error:", err);
  }
};

  // Split content into lines
  const lines = poem.content.replace(/§/g, "\n").split("\n");

  // Split into pages of 9 lines each
  for (let i = 0; i < lines.length;) {
    let k = 9;
    if (lines[i] === "") i ++;
    if (lines[i + 8] === "") k --;
    const chunk = lines.slice(i, i + k);
    i += k;
    pages.push(chunk);
  }

  useEffect(() => {
    setCurrentPage(0);
    setViewComments(false);
  }, [poem]);

  const rightPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const leftPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const commentsToggle = () => {
    setViewComments(!viewComments);
  }

  const bookmark_it = async () => {
    const user = getUserFromCookie();
    if (!user || !user.id || !poem || !poem._id) {
      alert("You must be logged in to bookmark poems.");
      console.warn("Missing user or poem data");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          poem_id: poem._id
        })
      });

      const result = await response.json();
      if (response.ok) {
        setBookmark(result.bookmarked);
        if (result.bookmarked) {
          poem.saves_count += 1;
        } else {
          poem.saves_count -= 1;
        }
      } else {
        console.error("Bookmark error:", result.error || result.message);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };


  const like_it = async () => {
    const user = getUserFromCookie();
    if (!user || !user.id || !poem || !poem._id) {
      alert("You must be logged in to like poems.");
      console.warn("Missing user or poem data");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/likes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          poem_id: poem._id
        })
      });

      const result = await response.json();
      if (response.ok) {
        setLiked(result.liked);
        if (result.liked) {
          poem.likes_count += 1;
        } else {
          poem.likes_count -= 1;
        }
      } else {
        console.error("Like error:", result.error || result.message);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };



  var max_pages = pages.length-1;

  return (
    <div className={styles.post}>
      <div className={styles.post_header}>
        <h1>{poem.title} <span>by {poem.author}</span></h1> <p>{poem.created_at}</p>
      </div>

      <div 
        className={styles.comments} 
        style={{left: viewComments ? "0vw" : "-30vw"}}
      >
            <p
                style={{fontSize: "2.5vh"}}
            >Comments</p>
            <p
                onClick={commentsToggle}
                className={styles.close_comm}
            >close</p>
            <div className={styles.comm_form}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                className={styles.button_next_page}
                onClick={submitComment}
              >
                ➤
              </button>
            </div>
            {
                poem.comments.map((comm, index) => (
                    <div className={styles.comm} key={index}>
                        <p className={styles.sender}><a href={"/" + comm.username}>@{comm.username}</a></p>
                        <p className={styles.msg_comm}>{comm.msg}</p>
                        <p className={styles.msg_comm}>{formatTimeAgo(comm.created_at)}</p>
                    </div>
                ))
            }

      </div>

      {pages.map((page, index) => (
        <div
          key={index}
          className={styles.post_content}
          style={{ display: index === currentPage ? "flex" : "none" }}
        >
          {page.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      ))}

      <div className={styles.post_pages}>
        {pages.map((_, i) => (
          <span key={i}>{i === currentPage ? "●" : "○"}</span>
        ))}
      </div>

      <div className={styles.post_actions}>
        <p><a href={"/" + poem.user}>@{poem.user}</a><br/>{formatTimeAgo(poem.posted_at)}</p>
        <button disabled={currentPage === 0} className={styles.button_next_page} onClick={leftPage}>«</button>
        <button disabled={currentPage === max_pages} className={styles.button_next_page} onClick={rightPage}>»</button>
        <p>
          <span onClick={like_it}> {is_liked ? "🧡" :"🤍"} {poem.likes_count}</span> | 
          <span style={{color: 'white'}} onClick={commentsToggle}> 🗨 {poem.comments.length}</span> | 
          <span onClick={bookmark_it}> { is_bookmarked ? "🔖" : "📑"} {poem.saves_count}</span>
        </p>
      </div>
    </div>
  );
}
