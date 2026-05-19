// Saves ALL users in one object
const users = loadFromStorage("all_users") || {};
users[email] = { email, name, password };
saveToStorage("all_users", users);

// Saves current session separately
saveToStorage("current_session", { email, name });