const sessions = new Map();

function setSession(id, data) {
  sessions.set(id, data);
}

function getSession(id) {
  return sessions.get(id);
}

module.exports = { setSession, getSession };
