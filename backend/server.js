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

// Add this route at the beginning of your routes to test database connectivity
app.get('/api/db-test', (req, res) => {
  console.log('Testing database connectivity...');
  
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed',
        details: err.message
      });
    }
    
    // Also test student table to ensure it exists and has the expected structure
    db.query('SELECT COUNT(*) AS count FROM student', (err, results) => {
      if (err) {
        console.error('Error accessing student table:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Cannot access student table',
          details: err.message
        });
      }
      
      console.log('Database connection test successful');
      res.json({
        success: true,
        database: 'connected',
        student_count: results[0].count
      });
    });
  });
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
  const query = 'SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND password = ?';
  
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

// Search student by ID
app.get('/api/student/search/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  console.log('Searching for student with ID:', studentId);

  try {
    // Log parameters for debugging
    console.log('Student ID type:', typeof studentId);
    console.log('Student ID value:', studentId);
    
    // First, let's check if the student exists by student_id only
    const query = `
      SELECT 
        s.student_id,
        s.lrn,
        CONCAT(s.lastname, ', ', s.firstname, ' ', IFNULL(s.middlename, '')) as name,
        s.current_yr_lvl as grade,
        sec.section_name as section
      FROM student s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      WHERE s.student_id = ?
    `;
    
    // Ensure we have a valid number for comparison
    let numericStudentId;
    try {
      numericStudentId = parseInt(studentId, 10);
      if (isNaN(numericStudentId)) {
        console.log('Invalid student ID (not a number):', studentId);
        return res.json({
          success: true,
          data: null
        });
      }
    } catch (e) {
      console.error('Error parsing student ID:', e);
      numericStudentId = null;
      return res.json({
        success: true,
        data: null
      });
    }
    
    console.log('Executing query:', query);
    console.log('Query parameters:', [numericStudentId]);
    
    db.query(query, [numericStudentId], (err, results) => {
      if (err) {
        console.error('Database error when searching student:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to search student',
          details: err.message
        });
      }

      console.log('Query results:', results);

      if (!results || results.length === 0) {
        console.log('No student found with ID:', studentId);
        return res.json({
          success: true,
          data: null
        });
      }

      const student = results[0];
      const response = {
        success: true,
        data: {
          student_id: student.student_id,
          lrn: student.lrn,
          name: student.name ? student.name.trim() : '',
          grade: student.grade || '',
          section: student.section || ''
        }
      };

      console.log('Sending response:', response);
      res.json(response);
    });
  } catch (error) {
    console.error('Unexpected error in student search endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Unexpected server error',
      details: error.message
    });
  }
});

// Search students by multiple criteria
app.get('/api/students/search', (req, res) => {
  console.log('Searching for students with criteria:', req.query);
  
  try {
    // Get search parameters from query
    const { name, grade, section, lrn } = req.query;
    
    // If it looks like a numeric ID, prioritize student_id search
    if (lrn && !isNaN(parseInt(lrn, 10))) {
      // This is likely a student ID scan from barcode
      const studentId = parseInt(lrn, 10);
      
      const exactQuery = `
        SELECT 
          s.student_id,
          s.lrn,
          CONCAT(s.lastname, ', ', s.firstname, ' ', IFNULL(s.middlename, '')) as name,
          s.current_yr_lvl as grade,
          sec.section_name as section
        FROM student s
        LEFT JOIN section sec ON s.section_id = sec.section_id
        WHERE s.student_id = ? AND s.status = 'active'
      `;
      
      console.log('Executing exact ID query:', exactQuery);
      console.log('Query parameters:', [studentId]);
      
      db.query(exactQuery, [studentId], (err, results) => {
        if (err) {
          console.error('Database error when searching for student ID:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to search student by ID',
            details: err.message
          });
        }
        
        console.log(`Found ${results.length} students with exact ID ${studentId}`);
        
        if (!results) {
          return res.json({
            success: true,
            data: []
          });
        }
        
        res.json({
          success: true,
          data: results.map(student => ({
            student_id: student.student_id,
            lrn: student.lrn,
            name: student.name ? student.name.trim() : '',
            grade: student.grade || '',
            section: student.section || ''
          }))
        });
      });
      
      return; // Exit early, we've handled this case
    }
    
    // Regular search for other cases (name search or LRN if explicitly needed)
    let query = `
      SELECT 
        s.student_id,
        s.lrn,
        CONCAT(s.lastname, ', ', s.firstname, ' ', IFNULL(s.middlename, '')) as name,
        s.current_yr_lvl as grade,
        sec.section_name as section
      FROM student s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      WHERE 1=1
    `;
    
    // Add parameters as needed
    const queryParams = [];
    
    if (name) {
      query += " AND (s.firstname LIKE ? OR s.lastname LIKE ? OR CONCAT(s.firstname, ' ', s.lastname) LIKE ?)";
      const searchName = `%${name}%`;
      queryParams.push(searchName, searchName, searchName);
    }
    
    if (grade) {
      query += " AND s.current_yr_lvl = ?";
      queryParams.push(grade);
    }
    
    if (section) {
      query += " AND sec.section_name LIKE ?";
      queryParams.push(`%${section}%`);
    }
    
    if (lrn) {
      // Only search by LRN when in name mode or explicitly looking for LRN
      query += " AND s.lrn LIKE ?";
      queryParams.push(`%${lrn}%`);
    }
    
    query += " AND s.status = 'active'"; // Add status check after all conditions
    query += " LIMIT 50"; // Limit results for better performance
    
    console.log('Executing query:', query);
    console.log('Query parameters:', queryParams);
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Database error when searching students:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to search students',
          details: err.message
        });
      }

      console.log(`Found ${results.length} students matching criteria`);
      
      if (!results) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      res.json({
        success: true,
        data: results.map(student => ({
          student_id: student.student_id,
          lrn: student.lrn,
          name: student.name ? student.name.trim() : '',
          grade: student.grade || '',
          section: student.section || ''
        }))
      });
    });
  } catch (error) {
    console.error('Unexpected error in students search endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Unexpected server error',
      details: error.message
    });
  }
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
        b.subject_name,
        a.section_id,
        a.subject_id,
        CONCAT(TIME_FORMAT(a.time_start, '%h:%i %p'), ' - ', TIME_FORMAT(a.time_end, '%h:%i %p')) AS time_range,
        a.day
      FROM SCHEDULE a 
      LEFT JOIN SUBJECT b ON a.subject_id = b.subject_id 
      LEFT JOIN section c ON a.section_id = c.section_id 
      LEFT JOIN employee d ON a.teacher_id = d.employee_id 
      LEFT JOIN school_year f ON a.school_year_id = f.school_year_id
      WHERE d.employee_id = ? AND a.schedule_status = 'Approved' AND a.school_year_id = ?`;

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

  // Get current day of the week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[new Date().getDay()];
  console.log('Current day:', currentDay);

  // First check if there's a schedule for today
  const scheduleQuery = `
    SELECT schedule_id, day 
    FROM schedule 
    WHERE subject_id = ? 
    AND day = ? 
    AND schedule_status = 'Approved'
  `;

  db.query(scheduleQuery, [subject_id, currentDay], (err, scheduleResults) => {
    if (err) {
      console.error('Database error checking schedule:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to check schedule',
        details: err.message 
      });
    }

    if (scheduleResults.length === 0) {
      console.log('No schedule found for today:', currentDay);
      return res.status(400).json({
        success: false,
        error: `No schedule for this subject on ${currentDay}`
      });
    }

    console.log('Schedule found for today:', scheduleResults[0]);
    const schedule_id = scheduleResults[0].schedule_id;

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

    // Check if an attendance record exists for today
    const checkQuery = `
      SELECT attendance_id 
      FROM attendance 
      WHERE schedule_id = ?
      AND student_id = ? 
      AND DATE(date) = CURDATE()
    `;

    console.log('Checking for existing record with query:', checkQuery);
    console.log('Query parameters:', [schedule_id, student_id]);

    db.query(checkQuery, [schedule_id, student_id], (err, results) => {
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
              schedule_id,
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

        console.log('Inserting new record with query:', insertQuery);
        console.log('Insert parameters:', [subject_id, schedule_id, dbStatus, student_id, student_name]);

        db.query(insertQuery, [subject_id, schedule_id, dbStatus, student_id, student_name], (err, insertResult) => {
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
              schedule_id,
              status: dbStatus,
              student_id,
              student_name
            }
          });
        });
      }
    });
  });
});

// Get attendance records for a schedule and date
app.get('/api/attendance/:scheduleId/:date', (req, res) => {
  const { scheduleId, date } = req.params;
  console.log('Fetching attendance records for:', { scheduleId, date });
  
  const query = `
    SELECT attendance_id, subject_id, schedule_id, student_id, student_name, status, 
           DATE_FORMAT(date, '%Y-%m-%d') as date
    FROM attendance 
    WHERE (subject_id = ? OR schedule_id = ?) 
    AND DATE(date) = ?
  `;

  console.log('Query:', query);
  console.log('Parameters:', [scheduleId, scheduleId, date]);

  db.query(query, [scheduleId, scheduleId, date], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch attendance records',
        details: err.message 
      });
    }

    console.log('Attendance records found:', results);

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

    console.log('Formatted results:', formattedResults);

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
      CONCAT('Grade ', a.grade_level, ' - ', d.section_name) AS section_grade,
      CONCAT('School Year ', e.school_year) AS school_year, 
      c.subject_name, 
      CONCAT(TIME_FORMAT(a.time_start, '%h:%i %p'), ' - ', TIME_FORMAT(a.time_end, '%h:%i %p')) AS time_range,
      CASE 
        WHEN b.status = 'P' THEN 'Present'
        WHEN b.status = 'A' THEN 'Absent'
        WHEN b.status = 'L' THEN 'Late'
        ELSE 'No Record'
      END AS attendance_status
    FROM schedule a
    LEFT JOIN attendance b 
      ON a.schedule_id = b.schedule_id 
      AND b.student_id = ?
      AND DATE_FORMAT(b.date, '%M %d, %Y') = ?
    LEFT JOIN subject c ON a.subject_id = c.subject_id 
    LEFT JOIN section d ON a.section_id = d.section_id 
    LEFT JOIN school_year e ON a.school_year_id = e.school_year_id 
    WHERE a.day = ? AND a.schedule_status = 'Approved' AND b.status != ''
  `;

  db.query(query, [studentId, date, day], (err, results) => {
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

// Add this route to help diagnose table structure issues
app.get('/api/diagnose/student', (req, res) => {
  console.log('Running student table diagnostics...');
  
  // First check if the table exists
  const dbName = process.env.DB_NAME || 'lnhsportal';
  
  // Get column information
  db.query(`
    SELECT column_name, data_type, is_nullable, column_key
    FROM information_schema.columns 
    WHERE table_schema = ? AND table_name = 'student'
  `, [dbName], (err, columnResults) => {
    if (err) {
      console.error('Error getting column information:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Error getting column information',
        details: err.message
      });
    }
    
    if (!columnResults || columnResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student table not found or has no columns' 
      });
    }
    
    // Get a sample row (first row) to see the data
    db.query('SELECT * FROM student LIMIT 1', (err, sampleResults) => {
      if (err) {
        console.error('Error getting sample student data:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Error getting sample data',
          details: err.message
        });
      }
      
      const columns = columnResults.map(col => col.column_name);
      const sampleData = sampleResults.length > 0 ? sampleResults[0] : null;
      
      // Return diagnostic information
      res.json({
        success: true,
        columns: columns,
        has_student_id: columns.includes('student_id'),
        has_lrn: columns.includes('lrn'),
        has_section: columns.includes('section'),
        has_grade: columns.includes('current_yr_lvl'),
        sample: sampleData ? {
          // Only include fields we know should exist in every student table
          student_id: sampleData.student_id,
          lrn: sampleData.lrn,
          // Only include these if they actually exist
          firstname: sampleData.firstname,
          lastname: sampleData.lastname,
          section: sampleData.section,
          current_yr_lvl: sampleData.current_yr_lvl
        } : null
      });
    });
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 