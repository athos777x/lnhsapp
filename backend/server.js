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

// Get school years endpoint
app.get('/api/school-years', (req, res) => {
  const query = `
    SELECT school_year 
    FROM school_year 
    ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, school_year_id ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    const schoolYears = results.map(row => row.school_year);
    res.json({
      success: true,
      data: schoolYears
    });
  });
});

// Get teacher's sections and subjects
app.get('/api/teacher/sections/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  console.log('Fetching sections for employee ID:', employeeId);
  
  const query = `
    SELECT 
      CONCAT('Grade',' ',b.grade_level) AS grade_level, 
      c.section_name, 
      IF(a.elective='0',b.subject_name,e.name) AS subject_name,
      a.section_id,
      a.subject_id
    FROM SCHEDULE a 
      LEFT JOIN SUBJECT b ON a.subject_id = b.subject_id 
      LEFT JOIN section c ON a.section_id = c.section_id 
      LEFT JOIN employee d ON a.teacher_id = d.employee_id 
      LEFT JOIN elective e ON a.elective = e.elective_id 
    WHERE d.employee_id = ?`;

  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    console.log('Query results:', results);
    res.json({
      success: true,
      data: results
    });
  });
});

// Add this new endpoint with improved logging
app.get('/api/employee/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log('Fetching employee ID for user:', userId);
  
  const query = `
    SELECT a.employee_id 
    FROM employee a 
    LEFT JOIN users b ON a.user_id = b.user_id 
    WHERE b.user_id = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: err.message 
      });
    }
    
    console.log('Query results:', results);
    
    if (results && results.length > 0) {
      const response = {
        success: true,
        data: {
          employee_id: results[0].employee_id
        }
      };
      console.log('Sending response:', response);
      res.json(response);
    } else {
      console.log('No employee found for user ID:', userId);
      res.status(404).json({ 
        success: false, 
        error: 'Employee not found',
        details: `No employee record found for user ID: ${userId}` 
      });
    }
  });
});

// Get students in a section
app.get('/api/section/:sectionId/students', (req, res) => {
  const sectionId = req.params.sectionId;
  console.log('Fetching students for section ID:', sectionId);
  
  const query = `
    SELECT 
      CONCAT(a.lastname,', ',a.firstname,' ', IFNULL(a.middlename,'')) AS stud_name,
      a.student_id,  
      a.lrn 
    FROM student a 
    LEFT JOIN section b ON a.section_id=b.section_id AND a.current_yr_lvl=b.grade_level 
    WHERE a.section_id = ?
  `;

  db.query(query, [sectionId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: err.message 
      });
    }
    
    console.log('Query results:', results);
    res.json({
      success: true,
      data: results.map(student => ({
        ...student,
        id: student.student_id.toString() // Ensure we have a unique id
      }))
    });
  });
});

// Get employee details
app.get('/api/employee/details/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  console.log('Fetching employee details for ID:', employeeId);
  
  const query = `
    SELECT 
      a.employee_id, 
      CONCAT(a.lastname,', ',a.firstname,' ', IFNULL(a.middlename,'')) AS emp_name, 
      a.address, 
      a.contact_number 
    FROM employee a 
    WHERE employee_id = ?
  `;

  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: err.message 
      });
    }
    
    if (results && results.length > 0) {
      console.log('Employee details found:', results[0]);
      res.json({
        success: true,
        data: results[0]
      });
    } else {
      console.log('No employee found with ID:', employeeId);
      res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 