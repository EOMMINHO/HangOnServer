let Turn = require("node-turn");
let server = new Turn({
  authMech: "long-term",
  credentials: {
    CS473: "CS473PW",
  },
});
server.start();
