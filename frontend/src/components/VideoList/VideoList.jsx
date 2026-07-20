import React, { useEffect, useRef, useState } from "react";
import axios from "../../axiosInstance";
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CommentSection from "../CommentSection/CommentSection";
import "./style.css";
import { useUser } from "../../context/UserContext";

export default function VideoList() {
  const [videos, setVideos] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [purchasedVideos, setPurchasedVideos] = useState([]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);

  // NEW: parent manages delete overlay & loading
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { videoId, commentId } or null
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0); // increment to tell children to refresh

  const navigate = useNavigate();
  const videoRefs = useRef({});
  const { userId } = useUser();

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await axios.get("/api/videos");
        setVideos(res.data.data || []);
        setErrorMsg("");
      } catch (err) {
        setErrorMsg(err?.response?.data?.message || "Failed to fetch videos.");
      }
    }

    async function fetchPurchases() {
      const token = localStorage.getItem("token");
      if (!token) {
        setPurchasedVideos([]);
        return;
      }

      try {
        const res = await axios.get("/api/user/my-purchases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const arr = (res.data.data || []).map((ele) => ele.video._id);
        setPurchasedVideos(arr);
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.log("Purchase fetch error:", err.message);
        }
        setPurchasedVideos([]);
      }
    }

    fetchVideos();
    fetchPurchases();
  }, []);

  function convertToEmbedUrl(url) {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;

      if (hostname === "youtu.be") {
        const videoId = parsed.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (hostname.includes("youtube.com") && parsed.searchParams.get("v")) {
        const videoId = parsed.searchParams.get("v");
        return `https://www.youtube.com/embed/${videoId}`;
      }

      return url;
    } catch {
      return url;
    }
  }

  function handleMessageOk() {
    setIsSuccess(null);
    setMessage("");
  }

  function handleClick(videoId, isUnlocked, isCreatorVideo) {
    if (isUnlocked || isCreatorVideo) {
      // scroll & play (kept as before)
      videoRefs.current[videoId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      const videoEl = videoRefs.current[videoId]?.querySelector("video");
      if (videoEl) videoEl.play();
    } else {
      navigate(`/video/buyandgift/${videoId}`);
      window.scrollTo(0, 0);
    }
  }

  function knowDetails(videoId) {
    navigate(`/video/details/${videoId}`);
    setTimeout(() => window.scrollTo(0, 0), 100);
  }

  function requestDelete(videoId, commentId) {
    setDeleteConfirm({ videoId, commentId });
  }

  // When parent confirms deletion from overlay
  async function confirmDelete() {
    if (!deleteConfirm || !deleteConfirm.commentId) return;
    setLoadingDelete(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.delete(`/api/user/comment/${deleteConfirm.commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // show parent overlay message as before
      setIsSuccess(true);
      setMessage(res.data?.message || "Comment deleted successfully");

      // tell children to refresh their comments (they will refetch when they see refreshCounter change)
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || err.message || "Delete failed");
    } finally {
      setLoadingDelete(false);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="feed-wrapper">
      <h1 className="feed-heading">Watch & Enjoy</h1>

      {errorMsg && (
        <p className="error-box">
          <div className="error-msg">{errorMsg}</div>
        </p>
      )}

      {videos.length === 0 && !errorMsg && (
        <p className="no-videos">No videos found</p>
      )}

      {videos.map((video) => {
        const isUnlocked =
          video.price === 0 || purchasedVideos.includes(video._id);
        const token = localStorage.getItem("token");
        const isCreatorVideo = token && video.creator.toString() === userId;

        return (
          <div
            className="feed-video-card"
            key={video._id}
            ref={(el) => (videoRefs.current[video._id] = el)}
          >
            <h2 className="video-title">{video.title}</h2>

            <div className="video-wrapper">
              {video.type === "short" ? (
                <video className="video-element" controls>
                  <source src={video.filePath} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  className="video-element"
                  src={convertToEmbedUrl(video.url)}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              )}

              {!isUnlocked && !isCreatorVideo && (
                <div className="video-overlay">
                  <p className="locked">
                    <FaLock /> Locked
                  </p>
                </div>
              )}
            </div>

            <div className="below-video">
              <p className="video-type">Type: {video.type}</p>

              <div className="video-action-buttons">
                <button
                  onClick={() =>
                    handleClick(video._id, isUnlocked, isCreatorVideo)
                  }
                >
                  {!isUnlocked && !isCreatorVideo ? "Buy and Watch" : "Watch Now"}
                </button>
                <button onClick={() => knowDetails(video._id)}>Details</button>
              </div>

              <CommentSection
                videoId={video._id}
                setMessage={setMessage}
                setIsSuccess={setIsSuccess}
                requestDelete={requestDelete}
                refreshCounter={refreshCounter}
              />
            </div>
          </div>
        );
      })}

      {/* Parent global delete-confirm overlay — full screen */}
      {deleteConfirm && (
        <div className="message-overlay">
          <div className="message-box">
            <div className="alert">
              <p>Are you sure you want to delete this comment?</p>
            </div>

            <div style={{ display: "flex", gap: "20px", justifyContent: "space-between" }}>
              <button
                className="alert-ok-btn"
                onClick={confirmDelete}
                disabled={loadingDelete}
              >
                {loadingDelete ? "Deleting..." : "Yes"}
              </button>

              <button
                className="alert-ok-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent global message overlay (existing behaviour) */}
      {message && (
        <div className="message-overlay">
          <div className="message-box">
            <div className={`alert ${isSuccess ? "success" : "error"}`}>
              <p>{message}</p>
            </div>
            <button className="alert-ok-btn" onClick={handleMessageOk}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
