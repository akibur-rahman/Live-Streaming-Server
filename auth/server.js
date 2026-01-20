const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded());

app.post("/auth", function (req, res) {
  /* This server is only available to nginx */
  const streamkey = req.body.key;

  /* You can make a database of users instead :) */
  if (streamkey === "aP9XfQ2mZL0WkD8sEJrTnU5cB") {
    res.status(200).send();
    return;
  }

  /* Reject the stream */
  res.status(403).send();
});

// Called by nginx-rtmp on publish end; deletes HLS artifacts for the stream
app.post("/cleanup", async function (req, res) {
  // nginx-rtmp posts urlencoded body with fields like app, name, addr, etc.
  const streamName = req.body.name;
  const hlsDir = "/tmp/hls";

  if (!streamName) {
    return res.status(400).send("missing name");
  }

  try {
    const files = await fs.promises.readdir(hlsDir);
    const deletions = files
      .filter((f) => f.startsWith(streamName + "-") && f.endsWith(".ts") || f === `${streamName}.m3u8`)
      .map((f) => fs.promises.rm(path.join(hlsDir, f), { force: true }));

    // Also handle nested mode (directory named after stream)
    const nestedPath = path.join(hlsDir, streamName);
    deletions.push(fs.promises.rm(nestedPath, { recursive: true, force: true }));

    await Promise.allSettled(deletions);
    return res.status(200).send();
  } catch (err) {
    // Still reply 200 so nginx doesn't retry forever; log the error
    console.error("cleanup error:", err);
    return res.status(200).send();
  }
});

app.listen(8000, function () {
  console.log("Listening on port 8000!");
});