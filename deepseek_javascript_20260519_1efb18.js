// Each user has their own bookmarks
const savedBookmarks = loadFromStorage(`bookmarks_${user.email}`);
// Auto-save whenever bookmarks change
useEffect(() => {
  saveToStorage(`bookmarks_${user.email}`, bookmarks);
}, [bookmarks, user.email]);