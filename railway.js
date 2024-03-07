const express = require('express');
const mysql = require('mysql2');

const app = express();

// Database Configuration
const DATABASE_CONFIG = {
  user: 'root',
  password: 'password',
  host: 'localhost',
  database: 'ticketregistration', // Existing database name
};

// Create a connection pool
const pool = mysql.createPool(DATABASE_CONFIG);

// API endpoint to receive and save data for train tickets
app.post('/getdata', express.json(), (req, res) => {
  const { Name, Train_no, Train_destination } = req.body;

  if (!Name || !Train_no || !Train_destination) {
    res.status(400).json({ error: 'Incomplete data. Please provide Name, Train_no, and Train_destination.' });
    return;
  }

  const query = 'INSERT INTO train_tickets (Name, Train_no, Train_destination, Status) VALUES (?, ?, ?, "notcheckedin")';

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    connection.query(query, [Name, Train_no, Train_destination], (queryError, result) => {
      connection.release(); // Release the connection back to the pool

      if (queryError) {
        console.error('Error executing SQL query:', queryError);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      const insertedTicketId = result.insertId;

      res.json({ success: true, insertedTicketId });
    });
  });
});

// API endpoint to update the check-in status for train tickets
app.post('/checkin', express.json(), (req, res) => {
  const { ticketId, status } = req.body;

  if (!ticketId || !status) {
    res.status(400).json({ error: 'Incomplete data. Please provide ticketId and status.' });
    return;
  }

  const query = 'UPDATE train_tickets SET Status = ? WHERE id = ?';

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    connection.query(query, [status, ticketId], (queryError, result) => {
      connection.release(); // Release the connection back to the pool

      if (queryError) {
        console.error('Error executing SQL query:', queryError);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      res.json({ success: true });
    });
  });
});

// API endpoint to get all train tickets
app.get('/traintickets', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    connection.query('SELECT * FROM train_tickets', (queryError, tickets) => {
      connection.release(); // Release the connection back to the pool

      if (queryError) {
        console.error('Error executing SQL query:', queryError);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      // Convert data to JSON format
      const tickets_json = tickets.map((ticket) => ({
        id: ticket.id,
        Name: ticket.Name,
        Train_no: ticket.Train_no,
        Train_destination: ticket.Train_destination,
        Status: ticket.Status,
      }));

      res.json({ tickets: tickets_json });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
