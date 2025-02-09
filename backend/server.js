const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'lnhsportal'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Example endpoint to get users
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Just for testing, Add attendance record
app.post('/api/attendance/add', (req, res) => {
    const { enrollment_id, schedule_id, status, student_id, student_name } = req.body;
  
    if (!enrollment_id || !schedule_id || !status || !student_id || !student_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    const query = 'INSERT INTO attendance (enrollment_id, schedule_id, status, student_id, student_name) VALUES (?, ?, ?, ?, ?)';
  
    db.query(query, [enrollment_id, schedule_id, status, student_id, student_name], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: 'Attendance recorded successfully',
        data: { id: results.insertId, ...req.body },
      });
    });
  });
  
// Role mapping for user types
const roleMap = {
  1: 'principal',
  2: 'student',
  3: 'subject_teacher',
  4: 'class_adviser',
  5: 'grade_level_coordinator',
  6: 'registrar',
  7: 'academic_coordinator',
  8: 'subject_coordinator'
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: username=${username}, password=${password}`);
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (results.length > 0) {
      const user = results[0];
      const role = roleMap[user.role_id];
      console.log('Login successful:', user);
      res.json({ 
        success: true,
        data: {
          userId: user.user_id,
          role,
          username: user.username
        }
      });
    } else {
      console.log('Login failed: invalid username or password');
      res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
  });
});

// Get user details endpoint
app.get('/api/users/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(`Fetching user details for userId: ${userId}`);
  
  const queryUser = 'SELECT username, role_id FROM users WHERE user_id = ?';
  db.query(queryUser, [userId], (err, userResults) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const roleId = user.role_id;
      let queryDetails;
      
      if (roleId === 2) { // Student
        queryDetails = `
          SELECT u.username, u.role_id, s.firstname, s.lastname, s.middlename, s.student_id
          FROM users u
          JOIN student s ON u.user_id = s.user_id
          WHERE u.user_id = ?
        `;
      } else { // Employee roles
        queryDetails = `
          SELECT u.username, u.role_id, e.firstname, e.lastname, e.middlename
          FROM users u
          JOIN employee e ON u.user_id = e.user_id
          WHERE u.user_id = ?
        `;
      }

      db.query(queryDetails, [userId], (err, detailsResults) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (detailsResults.length > 0) {
          const details = detailsResults[0];
          const fullName = `${details.firstname} ${details.middlename ? details.middlename + ' ' : ''}${details.lastname}`;
          res.json({
            success: true,
            data: {
              username: details.username,
              role_id: details.role_id,
              fullName,
              ...(details.student_id && { student_id: details.student_id })
            }
          });
        } else {
          console.log('User details not found for userId:', userId);
          res.status(404).json({ error: 'User details not found' });
        }
      });
    } else {
      console.log('User not found for userId:', userId);
      res.status(404).json({ error: 'User not found' });
    }
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 