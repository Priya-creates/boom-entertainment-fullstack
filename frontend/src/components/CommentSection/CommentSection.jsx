import React, { useEffect, useState } from "react";
import axios from "../../axiosInstance";
import { IoIosArrowDown } from "react-icons/io";
import { BsThreeDotsVertical } from "react-icons/bs";
import "./style.css";

export default function CommentSection({
  videoId,
  setMessage,
  setIsSuccess,
  requestDelete, // function(videoId, commentId) -> parent shows overlay
  refreshCounter, // number, parent increments after delete
}) {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [postComment, setPostComment] = useState("");
  const [loading, setLoading] = useState({ post: false, delete: false });
  const [deleteId, setDeleteId] = useState(null);
  const [openDeleteOption, setOpenDeleteOption] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const fetchComments = async () => {
    setFetchingComments(true);
    try {
      const res = await axios.get(`/api/videos/${videoId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data.data || []);
      console.log(res.data.data);
      setShowComments(true);
    } catch (err) {
      setIsSuccess?.(false);
      setMessage?.(
        err.response?.data?.message || err.message || "Failed to fetch comments"
      );
    } finally {
      setFetchingComments(false);
    }
  };

  const handleCommentToggle = async () => {
    if (!token) {
      setMessage("Please login to access the comments");
      setIsSuccess(false);
      return;
    }
    if (showComments) {
      setShowComments(false);
    } else {
      await fetchComments();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = postComment.trim();
    if (!trimmed) {
      setMessage("Comment cannot be empty.");
      setIsSuccess(false);
      return;
    }
    setLoading((p) => ({ ...p, post: true }));
    try {
      const formData = { user: userId, video: videoId, text: trimmed };
      const res = await axios.post(`/api/videos/${videoId}/comment`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        setIsSuccess(true);
        setMessage("Comment posted successfully");
        setPostComment("");
        await fetchComments();
      } else {
        setIsSuccess(false);
        setMessage("Something went wrong. Try again.");
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || err.message);
    } finally {
      setLoading((p) => ({ ...p, post: false }));
    }
  };

  useEffect(() => {
    if (refreshCounter == null) return;
    if (showComments) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  return (
    <div className="comment-wrapper">
      <div className="view-all-comments-btn" onClick={handleCommentToggle}>
        <span className="vac-text">View All Comments</span>
        {showComments && <IoIosArrowDown />}
      </div>

      {fetchingComments && !showComments && (
        <div className="comment-loading">Loading...</div>
      )}

      {showComments && (
        <div className="comment-box">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div className="comment-item" key={c._id}>
                <div className="comment-header">
                  <div className="comment-owner">
                    {c.user?.name || "Anonymous"}
                  </div>

                  {userId === c.user._id && (
                    <button
                      className="three-dots-btn"
                      onClick={() => {
                        setOpenDeleteOption((p) => !p);
                        setDeleteId(c._id);
                      }}
                    >
                      <BsThreeDotsVertical />
                    </button>
                  )}
                </div>

                <div className="comment-text">{c.text}</div>

                {openDeleteOption && deleteId === c._id && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => requestDelete(videoId, c._id)}
                    disabled={loading.delete}
                  >
                    Delete Comment
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="nocomment-text">No comments posted</p>
          )}
        </div>
      )}

      <div className="comment-post-box">
        <form onSubmit={handleSubmit} className="comment-form">
          <input
            type="text"
            placeholder="Felt something? Say it here..."
            value={postComment}
            onChange={(e) => setPostComment(e.target.value)}
            disabled={loading.post}
          />
          <button
            type="submit"
            className="post-btn"
            disabled={loading.post || postComment.trim().length === 0}
          >
            {loading.post ? "Posting..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
