const express = require("express")
const app = express()
const path = require("path")
const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, "MIDI-parser")))

app.get("/api/data", (req, res) => {
  // Your API endpoints
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "MIDI-parser", "index.html"))
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
