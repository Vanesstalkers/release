({
  sessions: new Map(),
  sessionOnline: new Set(),
  addSession({ token, sid, data }) {
    const { sessions, users, sessionOnline } = lib.auth;
    sessions.set(sid, { token, data });
    sessionOnline.add(token);
    console.log("addSession", Array.from( sessionOnline.keys() ), "application.worker.id=", application.worker.id)
  },
  deleteSession({ token, sid }) {
    // console.log("deleteSession", token, "application.worker.id=", application.worker.id);
    const { sessionOnline } = lib.auth;
    sessionOnline.delete(token);
    console.log("deleteSession", Array.from( sessionOnline.keys() ), "application.worker.id=", application.worker.id)
  },
  checkDublicate({ token }) {
    const { sessionOnline } = lib.auth;
    console.log("checkDublicate", Array.from( sessionOnline.keys() ), "application.worker.id=", application.worker.id)
    if (sessionOnline.has(token)) throw new Error('Session dublicate');
  },
});
