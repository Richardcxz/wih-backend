import express from "express";
import mysql from "mysql2/promise";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "https://richardcxz.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "PUT"],
  credentials: true
}));
app.use(express.json());

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

app.get("/", (req, res) => {
  res.send("API online");
});

app.get("/products", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM products ORDER BY position_order ASC"
  );

  res.json(rows);
});

app.post("/add", async (req, res) => {
  try {
    const { url } = req.body;

    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      "Produto";

    const image =
      $('meta[property="og:image"]').attr("content") ||
      "";

    let category = "Outros";

    const lower = title.toLowerCase();

    if (
      lower.includes("mouse") ||
      lower.includes("keyboard") ||
      lower.includes("teclado")
    ) {
      category = "Setup";
    }

    if (
      lower.includes("hoodie") ||
      lower.includes("camiseta") ||
      lower.includes("shirt")
    ) {
      category = "Roupas";
    }

    if (
      lower.includes("anime") ||
      lower.includes("pokemon")
    ) {
      category = "Anime";
    }

    await db.query(
      `INSERT INTO products
      (title, image, url, category)
      VALUES (?, ?, ?, ?)`,
      [title, image, url, category]
    );

    res.json({
      success: true
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Erro ao adicionar"
    });
  }
});

app.put("/favorite/:id", async (req, res) => {
  await db.query(
    `UPDATE products
     SET favorite = NOT favorite
     WHERE id = ?`,
    [req.params.id]
  );

  res.json({
    success: true
  });
});

app.listen(3000, () => {
  console.log("rodando");
});
