const express = require('express');
const path = require('path');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const viewers = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [viewerId, lastSeen] of viewers.entries()) {
    if (now - lastSeen > 30000) {
      viewers.delete(viewerId);
    }
  }
}, 5000);

app.post("/auth", function (req, res) {
  const streamkey = req.body.key;

  if (streamkey === "aP9XfQ2mZL0WkD8sEJrTnU5cB") {
    res.status(200).send();
    return;
  }


  res.status(403).send();
});



app.get("/hls/:file", (req, res) => {

  const filename = req.params.file;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const ua = req.headers['user-agent'] || 'unknown';
  const viewerId = `${ip}-${ua}`;
  viewers.set(viewerId, Date.now());
  const filePath = path.join('/tmp/hls', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("Manifest not found");
    }
  });
});


app.get("/viewers", (req, res) => {
  res.status(200).json({ count: viewers.size });
});



app.listen(8000, function () {
  console.log("Listening on port 8000!");
});