const userCommentTracker = {};

function isRateLimited(userId, now) {
  const windowSize = 60 * 1000;
  const maxComments = 5;

  if (!userCommentTracker[userId]) {
    userCommentTracker[userId] = [];
  }

  userCommentTracker[userId] = userCommentTracker[userId].filter(
    (ts) => now - ts < windowSize
  );

  if (userCommentTracker[userId].length >= maxComments) {
    return true;
  }

  userCommentTracker[userId].push(now);
  return false;
}

function deleteComment(userId, commentStamp) {
  const arr = userCommentTracker[userId];
  if (!arr) return;

  const idx = arr.indexOf(commentStamp);
  if (idx >= 0) {
    arr.splice(idx, 1);
  }
}



module.exports = {
  isRateLimited,
  deleteComment,
};
