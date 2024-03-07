const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');

const app = express();
const port = process.env.PORT || 8080;
const { createWriteStream, createReadStream, unlink } = require('fs');
const { resolve } = require('path');
const { PassThrough } = require('stream');

app.use(cors());
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'cpp',
  connectionLimit: 10,
});



app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username && password) {
      const [rows] = await pool.query("SELECT * FROM attendance WHERE username = ? AND password = ?", [username, password]);
      
      if (rows.length > 0) {
        console.log(`User '${username}' logged in`);
        res.status(200).json({ message: "success" });
      } else {
        res.status(401).json({ message: "Invalid username or password" });
      }
    } else {
      res.status(400).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});






app.post("/attendance-data", async (req, res) => {
  try {
      const userId = req.body.userId;

      if (!userId) {
          return res.status(400).json({ message: "User ID not provided" });
      }

      const [rows] = await pool.query("SELECT days_present, days_absent FROM attendance WHERE username = ?", [userId]);

      if (rows.length > 0) {
          // Assuming the columns in your table are named 'days_present', 'days_absent'
          const { days_present, days_absent } = rows[0];

          // Send the data as a JSON response
          return res.status(200).json({
              daysPresent: days_present,
              daysAbsent: days_absent
          });
      } else {
          return res.status(404).json({ message: "User not found or no attendance data available" });
      }
  } catch (error) {
      console.error('Error retrieving attendance data:', error);
      return res.status(500).json({ message: "Internal server error" });
  }
});

// Use GET for retrieving data
app.get("/all-attendance-data", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM attendance");

    if (rows.length > 0) {
      // Send the data as a JSON response
      return res.status(200).json({ attendanceData: rows });
    } else {
      return res.status(404).json({ message: "No attendance data available" });
    }
  } catch (error) {
    console.error('Error retrieving all attendance data:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
