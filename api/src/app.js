
const express = require("express");
const medicineRoutes = require("./routes/medicineRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "MediCheck API is running" });
});

app.use("/api/medicines", medicineRoutes);

module.exports = app;

