 const createTable = "CREATE TABLE users(id TEXT, username TEXT, oggi BOOLEAN, cinque BOOLEAN)"
 const insert = 'INSERT INTO users (id, username, oggi, cinque) VALUES (?,?,?,?)'
 const selectAll = 'SELECT * FROM users'
 const updateUser = 'UPDATE users SET oggi = ?  cinque = ? WHERE id = ? AND username = ? '
 const selectUser = 'SELECT * FROM users WHERE id = ? AND username = ?'