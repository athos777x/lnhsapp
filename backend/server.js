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
    SELECT school_year, school_year_id
    FROM school_year 
    ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, school_year_id ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// Get teacher's sections and subjects
app.get('/api/teacher/sections/:employeeId/:schoolYearId', (req, res) => {
  const employeeId = req.params.employeeId;
  const schoolYearId = req.params.schoolYearId;
  console.log('Fetching sections for employee ID:', employeeId, 'School Year ID:', schoolYearId);
  
  const query = `
    SELECT 
        CONCAT('Grade ', a.grade_level) AS grade_level, 
        c.section_name, 
        IF(a.elective = '0', b.subject_name, e.name) AS subject_name,
        a.section_id,
        a.subject_id,
        CONCAT(TIME_FORMAT(a.time_start, '%h:%i %p'), ' - ', TIME_FORMAT(a.time_end, '%h:%i %p')) AS time_range
      FROM SCHEDULE a 
      LEFT JOIN SUBJECT b ON a.subject_id = b.subject_id 
      LEFT JOIN section c ON a.section_id = c.section_id 
      LEFT JOIN employee d ON a.teacher_id = d.employee_id 
      LEFT JOIN elective e ON a.elective = e.elective_id 
      LEFT JOIN school_year f ON a.school_year_id=f.school_year_id
      WHERE d.employee_id = ? AND a.schedule_status='Approved' AND a.school_year_id = ?`;

  db.query(query, [employeeId, schoolYearId], (err, results) => {
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
    SELECT a.employee_id, 
      CONCAT(a.lastname,', ',a.firstname,' ', IFNULL(a.middlename,'')) AS emp_name, 
      DATE_FORMAT(a.birthday, '%M %d, %Y') AS birthday,
      a.gender, a.address, a.contact_number
      FROM employee a WHERE employee_id = ?
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

// Get school year ID from school year string
app.get('/api/school-year-id/:schoolYear', (req, res) => {
  const schoolYear = req.params.schoolYear;
  
  const query = 'SELECT school_year_id FROM school_year WHERE school_year = ?';
  
  db.query(query, [schoolYear], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (results.length > 0) {
      res.json({ id: results[0].school_year_id });
    } else {
      res.status(404).json({ error: 'School year not found' });
    }
  });
});

// Record student attendance
app.post('/api/attendance/record', (req, res) => {
  const { subject_id, status, student_id, student_name } = req.body;
  console.log('Received attendance record request:', { subject_id, status, student_id, student_name });

  if (!subject_id || !status || !student_id || !student_name) {
    console.log('Missing required fields:', { subject_id, status, student_id, student_name });
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields' 
    });
  }

  // Map the status to single character values
  const statusMap = {
    'present': 'P',
    'absent': 'A',
    'late': 'L'
  };

  const dbStatus = statusMap[status];
  console.log('Mapped status:', { original: status, mapped: dbStatus });
  
  if (!dbStatus) {
    console.log('Invalid status value:', status);
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be present, absent, or late'
    });
  }

  // First check if an attendance record exists for today
  const checkQuery = `
    SELECT attendance_id 
    FROM attendance 
    WHERE (subject_id = ? OR schedule_id = ?)
    AND student_id = ? 
    AND DATE(date) = CURDATE()
  `;

  console.log('Checking for existing record with query:', checkQuery);
  console.log('Query parameters:', [subject_id, subject_id, student_id]);

  db.query(checkQuery, [subject_id, subject_id, student_id], (err, results) => {
    if (err) {
      console.error('Database error during check:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to check attendance record',
        details: err.message 
      });
    }

    console.log('Check query results:', results);

    if (results.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE attendance 
        SET status = ?, 
            remarks = CURRENT_TIMESTAMP 
        WHERE attendance_id = ?
      `;

      console.log('Updating existing record with query:', updateQuery);
      console.log('Update parameters:', [dbStatus, results[0].attendance_id]);

      db.query(updateQuery, [dbStatus, results[0].attendance_id], (err, updateResult) => {
        if (err) {
          console.error('Database error during update:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to update attendance',
            details: err.message 
          });
        }

        console.log('Update successful:', updateResult);
        res.json({
          success: true,
          data: {
            attendance_id: results[0].attendance_id,
            subject_id,
            status: dbStatus,
            student_id,
            student_name
          }
        });
      });
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO attendance (subject_id, schedule_id, date, status, student_id, student_name, remarks) 
        VALUES (?, ?, NOW(), ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      // Use subject_id for both subject_id and schedule_id to ensure compatibility
      console.log('Inserting new record with query:', insertQuery);
      console.log('Insert parameters:', [subject_id, subject_id, dbStatus, student_id, student_name]);

      db.query(insertQuery, [subject_id, subject_id, dbStatus, student_id, student_name], (err, insertResult) => {
        if (err) {
          console.error('Database error during insert:', err);
          console.error('Error details:', err.message);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to record attendance',
            details: err.message 
          });
        }

        console.log('Insert successful:', insertResult);
        res.json({
          success: true,
          data: {
            attendance_id: insertResult.insertId,
            subject_id,
            status: dbStatus,
            student_id,
            student_name
          }
        });
      });
    }
  });
});

// Get attendance records for a schedule and date
app.get('/api/attendance/:scheduleId/:date', (req, res) => {
  const { scheduleId, date } = req.params;
  
  const query = `
    SELECT attendance_id, schedule_id, student_id, student_name, status, 
           DATE_FORMAT(date, '%Y-%m-%d') as date
    FROM attendance 
    WHERE schedule_id = ? 
    AND DATE(date) = ?
  `;

  db.query(query, [scheduleId, date], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch attendance records',
        details: err.message 
      });
    }

    // Map the single-character status back to full words
    const statusMap = {
      'P': 'present',
      'A': 'absent',
      'L': 'late'
    };

    const formattedResults = results.map(record => ({
      ...record,
      status: statusMap[record.status] || record.status
    }));

    res.json({
      success: true,
      data: formattedResults
    });
  });
});

// Get student profile details
app.get('/api/student/profile/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  console.log('Fetching student profile for ID:', studentId);
  
  const query = `
    SELECT 
      a.student_id, 
      CONCAT(a.lastname,', ',a.firstname,' ', IFNULL(a.middlename,'')) AS stud_name, 
      a.contact_number, 
      DATE_FORMAT(a.birthdate, "%M %d %Y") AS birthday, 
      a.gender, 
      a.age, 
      a.email_address, 
      a.mother_name, 
      a.father_name, 
      a.home_address 
    FROM student a 
    WHERE student_id = ?
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: err.message 
      });
    }
    
    if (results && results.length > 0) {
      console.log('Student profile found:', results[0]);
      res.json({
        success: true,
        data: results[0]
      });
    } else {
      console.log('No student found with ID:', studentId);
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
  });
});

// Get student ID from user ID
app.get('/api/student/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log('Fetching student ID for user:', userId);
  
  const query = `
    SELECT a.student_id 
    FROM student a 
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
          student_id: results[0].student_id
        }
      };
      console.log('Sending response:', response);
      res.json(response);
    } else {
      console.log('No student found for user ID:', userId);
      res.status(404).json({ 
        success: false, 
        error: 'Student not found',
        details: `No student record found for user ID: ${userId}` 
      });
    }
  });
});

// Get student daily attendance
app.get('/api/student/attendance/:studentId/:day/:date', (req, res) => {
  const { studentId, day, date } = req.params;
  console.log('Fetching student attendance for:', { studentId, day, date });
  
  const query = `
    SELECT 
      CONCAT('Grade', ' ', a.grade_level, ' - ', d.section_name) AS section_grade,
      CONCAT('School Year', ' ', e.school_year) AS school_year, 
      c.subject_name, 
      CONCAT(TIME_FORMAT(a.time_start, '%h:%i %p'), ' - ', TIME_FORMAT(a.time_end, '%h:%i %p')) AS time_range,
      CASE 
        WHEN b.status = 'P' THEN 'Present'
        WHEN b.status = 'A' THEN 'Absent'
        WHEN b.status = 'L' THEN 'Late'
      END AS status 
    FROM schedule a 
    LEFT JOIN attendance b ON a.schedule_id = b.schedule_id 
    LEFT JOIN subject c ON a.subject_id = c.subject_id 
    LEFT JOIN section d ON a.section_id = d.section_id 
    LEFT JOIN school_year e ON a.school_year_id = e.school_year_id 
    WHERE b.student_id = ? 
    AND a.day = ? 
    AND DATE_FORMAT(b.date, '%M %d, %Y') = ?
  `;

  db.query(query, [studentId, day, date], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: err.message 
      });
    }
    
    console.log('Student attendance results:', results);
    res.json({
      success: true,
      data: results
    });
  });
});

// Get current attendance status for a student
app.get('/api/attendance/status/:subjectId/:studentId', (req, res) => {
  const { subjectId, studentId } = req.params;
  console.log('Checking attendance status for:', { subjectId, studentId });
  
  const query = `
    SELECT attendance_id, subject_id, student_id, student_name, status, 
           DATE_FORMAT(date, '%Y-%m-%d') as date
    FROM attendance 
    WHERE subject_id = ? 
    AND student_id = ? 
    AND DATE(date) = CURDATE()
  `;

  db.query(query, [subjectId, studentId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch attendance status',
        details: err.message 
      });
    }

    console.log('Attendance status results:', results);

    if (results.length > 0) {
      // Map the single-character status back to full words
      const statusMap = {
        'P': 'present',
        'A': 'absent',
        'L': 'late'
      };

      const record = results[0];
      res.json({
        success: true,
        data: {
          ...record,
          status: statusMap[record.status] || record.status
        }
      });
    } else {
      res.json({
        success: true,
        data: null,
        message: 'No attendance record found for today'
      });
    }
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 