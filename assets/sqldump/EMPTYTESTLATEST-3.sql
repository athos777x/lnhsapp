/*
SQLyog Ultimate v9.62 
MySQL - 5.6.37-log : Database - lnhsportal
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`lnhsportal` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `lnhsportal`;

/*Table structure for table `attendance` */

DROP TABLE IF EXISTS `attendance`;

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `enrollment_id` int(12) DEFAULT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `status` enum('P','A','L') DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `remarks` timestamp NULL DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `fk_student_id` (`student_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`schedule_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Data for the table `attendance` */

insert  into `attendance`(`attendance_id`,`enrollment_id`,`schedule_id`,`date`,`status`,`student_id`,`student_name`,`remarks`,`subject_id`,`school_year_id`) values (1,NULL,5,'2025-04-20','A',1,'Bautista, Angel J','2025-04-20 22:05:39',1,1);

/*Table structure for table `brigada_details` */

DROP TABLE IF EXISTS `brigada_details`;

CREATE TABLE `brigada_details` (
  `brigada_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `remarks` varchar(100) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `brigada_status` enum('Attended','Not Attended') DEFAULT NULL,
  PRIMARY KEY (`brigada_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

/*Data for the table `brigada_details` */

insert  into `brigada_details`(`brigada_id`,`student_id`,`remarks`,`school_year_id`,`brigada_status`) values (3,1,'',1,'Attended'),(4,2,'afasfa',1,'Attended');

/*Table structure for table `components` */

DROP TABLE IF EXISTS `components`;

CREATE TABLE `components` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `component_id` int(11) DEFAULT NULL,
  `scores` int(11) DEFAULT NULL,
  `total_items` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  `period` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `components` */

/*Table structure for table `components_name` */

DROP TABLE IF EXISTS `components_name`;

CREATE TABLE `components_name` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `component_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `components_name` */

/*Table structure for table `dtr` */

DROP TABLE IF EXISTS `dtr`;

CREATE TABLE `dtr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stud_id` int(11) DEFAULT NULL,
  `status` enum('P','A','L') DEFAULT NULL,
  `log_date` datetime DEFAULT NULL,
  `subject` int(11) DEFAULT NULL,
  `yr` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `section` int(11) DEFAULT NULL,
  `sy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `dtr` */

/*Table structure for table `elective` */

DROP TABLE IF EXISTS `elective`;

CREATE TABLE `elective` (
  `elective_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `max_capacity` int(35) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `archive_status` enum('unarchive','archive') DEFAULT 'unarchive',
  `school_year_id` int(11) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`elective_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `elective` */

/*Table structure for table `employee` */

DROP TABLE IF EXISTS `employee`;

CREATE TABLE `employee` (
  `employee_id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(30) DEFAULT NULL,
  `lastname` varchar(30) DEFAULT NULL,
  `middlename` varchar(30) DEFAULT NULL,
  `status` enum('active','resigned','retired') NOT NULL DEFAULT 'active',
  `contact_number` varchar(11) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `year_started` varchar(4) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `archive_status` enum('unarchive','archived') NOT NULL DEFAULT 'unarchive',
  `gender` varchar(50) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `email_address` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  KEY `fk_user_id` (`user_id`),
  KEY `fk_role` (`role_id`),
  CONSTRAINT `fk_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

/*Data for the table `employee` */

insert  into `employee`(`employee_id`,`firstname`,`lastname`,`middlename`,`status`,`contact_number`,`address`,`year_started`,`role_name`,`role_id`,`user_id`,`archive_status`,`gender`,`birthday`,`email_address`) values (1,'Dante','Roe','A.','active','09348394384','123 Main St','2020','principal',1,5,'unarchive','Male','2025-02-13',NULL),(2,'Zane','Youth','B.','active','0987654321','456 Elm St','2021','subject_teacher',3,6,'unarchive','Male','2025-06-05',NULL),(3,'John','Doe','T.','active','1234567890','123 Oak St','2022','class_adviser',4,7,'unarchive','Male','2025-04-10',NULL),(4,'Jane','Smith','A.','active','09234234324','456 Pine St','2023','grade_level_coordinator',5,8,'unarchive','Male','2020-06-25',NULL),(5,'Alaine','Johnson','E.','active','09343984938','789 Maple St','2023','registrar',6,9,'unarchive','Male','2025-01-13',NULL),(6,'Emily','Brown','C.','active','0987654321','789 Birch St','2023','academic_coordinator',7,10,'unarchive','Male','2015-07-17',NULL),(7,'Michael','White','D.','active','1234567890','456 Oak St','2023','subject_coordinator',8,11,'unarchive','Male','2015-07-17',NULL);

/*Table structure for table `employee_roles` */

DROP TABLE IF EXISTS `employee_roles`;

CREATE TABLE `employee_roles` (
  `employee_role_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `employee_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`employee_role_id`),
  KEY `fk_employee` (`employee_id`),
  KEY `fk_role_in_employee_roles` (`role_id`),
  CONSTRAINT `fk_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_in_employee_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `employee_roles` */

/*Table structure for table `enrollment` */

DROP TABLE IF EXISTS `enrollment`;

CREATE TABLE `enrollment` (
  `enrollment_id` int(12) NOT NULL AUTO_INCREMENT,
  `student_id` int(12) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `enrolling_officer_id` int(11) DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `grade_level` varchar(5) DEFAULT NULL,
  `enrollee_type` varchar(20) DEFAULT NULL,
  `brigada_id` int(11) DEFAULT NULL,
  `enrollment_status` enum('active','pending','inactive') DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `student_school_year_id` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`enrollment_id`),
  KEY `student_id` (`student_id`),
  KEY `section_id` (`section_id`),
  KEY `enrolling_officer_id` (`enrolling_officer_id`),
  KEY `fk_enrollment_student_school_year_id` (`student_school_year_id`),
  KEY `fk_enrollment_school_year_id` (`school_year_id`),
  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`),
  CONSTRAINT `enrollment_ibfk_3` FOREIGN KEY (`enrolling_officer_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

/*Data for the table `enrollment` */

insert  into `enrollment`(`enrollment_id`,`student_id`,`section_id`,`enrolling_officer_id`,`enrollment_date`,`grade_level`,`enrollee_type`,`brigada_id`,`enrollment_status`,`student_name`,`student_school_year_id`,`school_year_id`) values (4,1,1,NULL,'2025-04-18','7','Regular',3,'active','angel j. bautista',NULL,1),(5,2,2,NULL,'2025-04-18','7','Regular',4,'active','rephaim celix l. domapias',NULL,1),(6,3,NULL,NULL,'2025-04-20','7','Regular',5,'inactive','etest t. test',NULL,1),(7,4,NULL,NULL,'2025-04-20','7','Regular',6,'inactive','twe t. trtwe',NULL,1),(8,5,NULL,NULL,'2025-04-20','7','Regular',7,'inactive','sdfsd f. sadfdsf',NULL,1),(9,6,NULL,NULL,'2025-04-20','7','Regular',8,'inactive','ewq q. qwwqeqw',NULL,1),(10,7,NULL,NULL,'2025-04-20','7','Regular',9,'inactive','fdgdf h. dsfds',NULL,1),(11,8,NULL,NULL,'2025-04-20','8','Regular',10,'inactive','dfdsfsd s. dsfsdf',NULL,1);

/*Table structure for table `grades` */

DROP TABLE IF EXISTS `grades`;

CREATE TABLE `grades` (
  `grades_id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) DEFAULT NULL,
  `enrollment_id` int(12) DEFAULT NULL,
  `grade_level` int(11) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `grade` float DEFAULT NULL,
  `period` int(11) NOT NULL,
  `remarks` text,
  `student_id` int(11) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`grades_id`,`grade_level`,`subject_name`,`period`,`student_id`,`student_name`),
  UNIQUE KEY `unique_student_grade` (`student_id`,`subject_name`,`grade_level`,`period`,`school_year_id`,`section_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `fk_grades_student_id` (`student_id`),
  KEY `fk_grades_school_year_id` (`school_year_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`schedule_id`),
  CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `grades` */

/*Table structure for table `grades_detail` */

DROP TABLE IF EXISTS `grades_detail`;

CREATE TABLE `grades_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grades_id` int(11) DEFAULT NULL,
  `written_works` float DEFAULT NULL,
  `performance_task` float DEFAULT NULL,
  `quarterly_assessment` float DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `period` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_grade_period` (`grades_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `grades_detail` */

/*Table structure for table `marks` */

DROP TABLE IF EXISTS `marks`;

CREATE TABLE `marks` (
  `student_id` int(11) NOT NULL,
  `sy` varchar(10) DEFAULT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  `period` int(11) DEFAULT NULL,
  `grade` float DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `marks` */

/*Table structure for table `nutrition` */

DROP TABLE IF EXISTS `nutrition`;

CREATE TABLE `nutrition` (
  `nutrition_id` int(11) NOT NULL AUTO_INCREMENT,
  `enrollment_id` int(12) DEFAULT NULL,
  `height` double(5,2) DEFAULT NULL,
  `weight` double(5,2) DEFAULT NULL,
  PRIMARY KEY (`nutrition_id`),
  KEY `enrollment_id` (`enrollment_id`),
  CONSTRAINT `nutrition_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `nutrition` */

/*Table structure for table `period` */

DROP TABLE IF EXISTS `period`;

CREATE TABLE `period` (
  `period` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(255) DEFAULT NULL,
  KEY `period` (`period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `period` */

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(255) DEFAULT NULL,
  `role_description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

/*Data for the table `roles` */

insert  into `roles`(`role_id`,`role_name`,`role_description`) values (1,'principal','Principal role'),(2,'student','Student role'),(3,'subject_teacher','Subject Teacher role'),(4,'class_adviser','Class Adviser role'),(5,'grade_level_coordinator','Grade Level Coordinator role'),(6,'registrar','Registrar role'),(7,'academic_coordinator','Academic Coordinator role'),(8,'subject_coordinator','Subject Coordinator role');

/*Table structure for table `schedule` */

DROP TABLE IF EXISTS `schedule`;

CREATE TABLE `schedule` (
  `schedule_id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `time_start` varchar(12) DEFAULT NULL,
  `time_end` varchar(12) DEFAULT NULL,
  `day` varchar(225) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `schedule_status` enum('Approved','Pending Approval') NOT NULL DEFAULT 'Pending Approval',
  `elective` int(11) NOT NULL DEFAULT '0',
  `grade_level` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `subject_id` (`subject_id`),
  KEY `fk_schedule_section_id` (`section_id`),
  CONSTRAINT `fk_schedule_section_id` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`),
  CONSTRAINT `schedule_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

/*Data for the table `schedule` */

insert  into `schedule`(`schedule_id`,`teacher_id`,`subject_id`,`time_start`,`time_end`,`day`,`section_id`,`schedule_status`,`elective`,`grade_level`,`school_year_id`) values (5,2,1,'07:00','08:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\",\"Sunday\"]',1,'Approved',0,7,1);

/*Table structure for table `school_year` */

DROP TABLE IF EXISTS `school_year`;

CREATE TABLE `school_year` (
  `school_year_id` int(11) NOT NULL AUTO_INCREMENT,
  `school_year_start` date DEFAULT NULL,
  `school_year_end` date DEFAULT NULL,
  `school_year` varchar(10) DEFAULT NULL,
  `enrollment_start` date DEFAULT NULL,
  `enrollment_end` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Data for the table `school_year` */

insert  into `school_year`(`school_year_id`,`school_year_start`,`school_year_end`,`school_year`,`enrollment_start`,`enrollment_end`,`status`) values (1,'2025-04-16','2026-04-16','2025-2026','2025-04-16','2025-04-26','active');

/*Table structure for table `section` */

DROP TABLE IF EXISTS `section`;

CREATE TABLE `section` (
  `section_id` int(11) NOT NULL AUTO_INCREMENT,
  `section_name` varchar(30) DEFAULT NULL,
  `grade_level` varchar(5) DEFAULT NULL,
  `status` varchar(8) DEFAULT NULL,
  `max_capacity` int(4) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `room_number` int(11) DEFAULT NULL,
  `archive_status` varchar(255) DEFAULT NULL,
  `section_adviser` int(11) DEFAULT NULL,
  PRIMARY KEY (`section_id`),
  KEY `fk_section_school_year_id` (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

/*Data for the table `section` */

insert  into `section`(`section_id`,`section_name`,`grade_level`,`status`,`max_capacity`,`school_year_id`,`room_number`,`archive_status`,`section_adviser`) values (1,'Aquila','7','active',50,1,200,'unarchive',NULL),(2,'Phoenix','7','active',10,1,222,'unarchive',NULL);

/*Table structure for table `section_assigned` */

DROP TABLE IF EXISTS `section_assigned`;

CREATE TABLE `section_assigned` (
  `section_assigned_id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  PRIMARY KEY (`section_assigned_id`),
  UNIQUE KEY `unique_teacher_subject` (`section_id`,`employee_id`,`school_year_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `section_assigned` */

/*Table structure for table `student` */

DROP TABLE IF EXISTS `student`;

CREATE TABLE `student` (
  `student_id` int(12) NOT NULL,
  `lrn` int(100) DEFAULT NULL,
  `lastname` varchar(30) DEFAULT NULL,
  `middlename` varchar(30) DEFAULT NULL,
  `firstname` varchar(30) DEFAULT NULL,
  `current_yr_lvl` varchar(11) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `barangay` varchar(50) DEFAULT NULL,
  `city_municipality` varchar(50) DEFAULT NULL,
  `province` varchar(50) DEFAULT NULL,
  `contact_number` varchar(11) DEFAULT NULL,
  `email_address` varchar(50) DEFAULT NULL,
  `mother_name` varchar(50) DEFAULT NULL,
  `father_name` varchar(50) DEFAULT NULL,
  `parent_address` varchar(255) DEFAULT NULL,
  `father_occupation` varchar(50) DEFAULT NULL,
  `mother_occupation` varchar(50) DEFAULT NULL,
  `annual_hshld_income` double(10,2) DEFAULT NULL,
  `number_of_siblings` int(3) DEFAULT NULL,
  `father_educ_lvl` varchar(30) DEFAULT NULL,
  `mother_educ_lvl` varchar(30) DEFAULT NULL,
  `father_contact_number` varchar(11) DEFAULT NULL,
  `mother_contact_number` varchar(11) DEFAULT NULL,
  `id_picture` varchar(100) DEFAULT NULL,
  `birth_certificate` varchar(100) DEFAULT NULL,
  `form_138` varchar(100) DEFAULT NULL,
  `goodmoral_cert` varchar(100) DEFAULT NULL,
  `rcv_test` varchar(100) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `emergency_number` varchar(11) DEFAULT NULL,
  `status` enum('active','inactive','transferred','withdrawn') DEFAULT 'active',
  `active_status` enum('unarchive','archived') DEFAULT 'unarchive',
  `brigada_id` int(11) DEFAULT NULL,
  `enroll_date` date DEFAULT NULL,
  `emergency_relation` varchar(50) DEFAULT NULL,
  `emergency_contactperson` varchar(50) DEFAULT NULL,
  KEY `fk_section` (`section_id`),
  KEY `fk_student_user_id` (`user_id`),
  CONSTRAINT `fk_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`),
  CONSTRAINT `fk_student_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `student` */

insert  into `student`(`student_id`,`lrn`,`lastname`,`middlename`,`firstname`,`current_yr_lvl`,`birthdate`,`gender`,`age`,`home_address`,`barangay`,`city_municipality`,`province`,`contact_number`,`email_address`,`mother_name`,`father_name`,`parent_address`,`father_occupation`,`mother_occupation`,`annual_hshld_income`,`number_of_siblings`,`father_educ_lvl`,`mother_educ_lvl`,`father_contact_number`,`mother_contact_number`,`id_picture`,`birth_certificate`,`form_138`,`goodmoral_cert`,`rcv_test`,`section_id`,`user_id`,`emergency_number`,`status`,`active_status`,`brigada_id`,`enroll_date`,`emergency_relation`,`emergency_contactperson`) values (1,6343121,'Bautista','J','Angel','7','2015-04-07','Male',10,'','','','','','','','','','','',0.00,0,'','','','',NULL,NULL,NULL,NULL,NULL,1,14,'','active','unarchive',3,'2025-04-18',NULL,''),(2,438937,'Domapias','Lao','Rephaim Celix','7','2015-03-30','Male',10,'','','','','','','','','','','',0.00,0,'','','','',NULL,NULL,NULL,NULL,NULL,2,15,'','active','unarchive',4,'2025-04-18',NULL,'');

/*Table structure for table `student_elective` */

DROP TABLE IF EXISTS `student_elective`;

CREATE TABLE `student_elective` (
  `student_elective_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `elective_id` int(11) DEFAULT NULL,
  `enrollment_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `student_id` int(11) DEFAULT NULL,
  `grade_level` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_elective_id`),
  KEY `elective_id` (`elective_id`),
  KEY `student_elective_ibfk_1` (`user_id`),
  KEY `student_elective_ibfk_3` (`student_id`),
  CONSTRAINT `student_elective_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `student` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

/*Data for the table `student_elective` */

insert  into `student_elective`(`student_elective_id`,`user_id`,`elective_id`,`enrollment_status`,`student_id`,`grade_level`,`school_year_id`,`section_id`) values (1,14,4,'approved',1,7,1,1),(3,15,3,'approved',2,7,1,2);

/*Table structure for table `student_school_year` */

DROP TABLE IF EXISTS `student_school_year`;

CREATE TABLE `student_school_year` (
  `student_school_year_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `status` enum('active','inactive','pending') NOT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `grade_level` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_school_year_id`),
  KEY `student_id` (`student_id`),
  KEY `school_year_id` (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

/*Data for the table `student_school_year` */

insert  into `student_school_year`(`student_school_year_id`,`student_id`,`school_year_id`,`status`,`student_name`,`grade_level`) values (3,1,1,'active','angel j. bautista',7),(4,2,1,'active','rephaim celix l. domapias',8),(5,3,1,'active','etest t. test',7),(6,4,1,'active','twe t. trtwe',7),(7,5,1,'active','sdfsd f. sadfdsf',7),(8,6,1,'active','ewq q. qwwqeqw',7),(9,7,1,'active','fdgdf h. dsfds',7),(10,8,1,'active','dfdsfsd s. dsfsdf',8);

/*Table structure for table `subject` */

DROP TABLE IF EXISTS `subject`;

CREATE TABLE `subject` (
  `subject_id` int(11) NOT NULL AUTO_INCREMENT,
  `grade_level` int(11) DEFAULT NULL,
  `subject_name` varchar(50) DEFAULT NULL,
  `status` varchar(8) DEFAULT NULL,
  `grading_criteria` varchar(255) DEFAULT NULL,
  `description` text,
  `archive_status` enum('archive','unarchive') NOT NULL DEFAULT 'unarchive',
  `school_year_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `elective` enum('Y','N') NOT NULL DEFAULT 'N',
  `max_capacity` int(35) DEFAULT NULL,
  PRIMARY KEY (`subject_id`),
  KEY `fk_subject_school_year_id` (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

/*Data for the table `subject` */

insert  into `subject`(`subject_id`,`grade_level`,`subject_name`,`status`,`grading_criteria`,`description`,`archive_status`,`school_year_id`,`employee_id`,`elective`,`max_capacity`) values (1,7,'English 7','active',NULL,'English Class','unarchive',1,NULL,'N',NULL),(2,7,'Physical Education 7','active',NULL,'PE 7','unarchive',1,NULL,'N',NULL),(3,NULL,'Spanish101','active',NULL,'Spanish Elective Class','unarchive',1,NULL,'Y',50),(4,NULL,'Japanese101','active',NULL,'Japanese Elective Class','unarchive',1,NULL,'Y',NULL);

/*Table structure for table `subject_assigned` */

DROP TABLE IF EXISTS `subject_assigned`;

CREATE TABLE `subject_assigned` (
  `subject_assigned_id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) DEFAULT NULL,
  `level` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `elective` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  PRIMARY KEY (`subject_assigned_id`),
  UNIQUE KEY `unique_subject_id` (`subject_id`),
  UNIQUE KEY `subject_id` (`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `subject_assigned` */

/*Table structure for table `teacher_subject` */

DROP TABLE IF EXISTS `teacher_subject`;

CREATE TABLE `teacher_subject` (
  `subject_assigned_id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) DEFAULT NULL,
  `level` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `elective` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  PRIMARY KEY (`subject_assigned_id`),
  UNIQUE KEY `unique_subject_id` (`subject_id`),
  UNIQUE KEY `subject_id` (`subject_id`),
  UNIQUE KEY `unique_teacher_subject` (`subject_id`,`section_id`,`employee_id`,`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

/*Data for the table `teacher_subject` */

insert  into `teacher_subject`(`subject_assigned_id`,`subject_id`,`level`,`section_id`,`employee_id`,`elective`,`school_year_id`) values (5,1,7,1,2,0,1);

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `password1` varchar(100) DEFAULT NULL,
  `other_role_name` varchar(200) DEFAULT NULL,
  `profile_picture_url` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_users_role_name` (`role_name`),
  KEY `fk_role_in_users` (`role_id`),
  CONSTRAINT `fk_role_in_users` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_users_role_name` FOREIGN KEY (`role_name`) REFERENCES `roles` (`role_name`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;

/*Data for the table `users` */

insert  into `users`(`user_id`,`username`,`password`,`role_id`,`role_name`,`password1`,`other_role_name`,`profile_picture_url`) values (1,'admin','adminpass',1,'principal',NULL,NULL,NULL),(5,'dante_r@lnhs.com','dantepass',1,'principal',NULL,'subject_teacher','http://localhost:3001/uploads/profile-pictures/user_5.jpg'),(6,'zane_y@lnhs.com','zanepass',3,'subject_teacher',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_6.jpg'),(7,'john_d@lnhs.com','johnpass',4,'class_adviser',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_7.jpg'),(8,'jane_s@lnhs.com','janepass',5,'grade_level_coordinator',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_8.jpg'),(9,'alice_j@lnhs.com','alicepass',6,'registrar',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_9.jpg'),(10,'emily_b@lnhs.com','emilypass',7,'academic_coordinator',NULL,'subject_teacher','http://localhost:3001/uploads/profile-pictures/user_10.jpg'),(11,'michael_w@lnhs.com','michaelpass',8,'subject_coordinator',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_11.jpg'),(14,'bautista.angel@lnhs.com','1234',2,'student',NULL,NULL,NULL),(15,'domapias.rephaim_celix@lnhs.com','1234',2,'student',NULL,NULL,NULL),(16,'test.etest@lnhs.com','1234',2,'student',NULL,NULL,NULL),(17,'trtwe.twe@lnhs.com','1234',2,'student',NULL,NULL,NULL),(18,'sadfdsf.sdfsd@lnhs.com','1234',2,'student',NULL,NULL,NULL),(19,'qwwqeqw.ewq@lnhs.com','1234',2,'student',NULL,NULL,NULL),(20,'dsfds.fdgdf@lnhs.com','1234',2,'student',NULL,NULL,NULL),(21,'dsfsdf.dfdsfsd@lnhs.com','1234',2,'student',NULL,NULL,NULL);

/*!50106 set global event_scheduler = 1*/;

/* Event structure for event `update_student_status_event` */

/*!50106 DROP EVENT IF EXISTS `update_student_status_event`*/;

DELIMITER $$

/*!50106 CREATE DEFINER=`root`@`localhost` EVENT `update_student_status_event` ON SCHEDULE EVERY 1 DAY STARTS '2024-06-25 04:14:44' ON COMPLETION NOT PRESERVE ENABLE DO CALL update_student_status('2023-2024') */$$
DELIMITER ;

/* Function  structure for function  `ProperCase` */

/*!50003 DROP FUNCTION IF EXISTS `ProperCase` */;
DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` FUNCTION `ProperCase`(str TEXT) RETURNS text CHARSET utf8
    DETERMINISTIC
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE result TEXT DEFAULT '';
  DECLARE c CHAR(1);
  DECLARE capitalizeNext BOOLEAN DEFAULT TRUE;
  WHILE i <= CHAR_LENGTH(str) DO
    SET c = SUBSTRING(str, i, 1);
    IF capitalizeNext AND c REGEXP '[a-zA-Z]' THEN
      SET result = CONCAT(result, UPPER(c));
      SET capitalizeNext = FALSE;
    ELSE
      SET result = CONCAT(result, LOWER(c));
      IF c = ' ' THEN
        SET capitalizeNext = TRUE;
      END IF;
    END IF;
    SET i = i + 1;
  END WHILE;
  RETURN result;
END */$$
DELIMITER ;

/* Procedure structure for procedure `update_student_status` */

/*!50003 DROP PROCEDURE IF EXISTS  `update_student_status` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `update_student_status`(IN school_year VARCHAR(50))
BEGIN
  -- Activate students
  UPDATE student s
  JOIN enrollment e ON s.student_id = e.student_id
  JOIN school_year sy ON e.enrollment_date BETWEEN sy.enrollment_start AND sy.enrollment_end
  SET s.student_status = 'active'
  WHERE sy.school_year = school_year;
  -- Deactivate students
  UPDATE student s
  LEFT JOIN (
    SELECT e.student_id
    FROM enrollment e
    JOIN school_year sy ON e.enrollment_date BETWEEN sy.enrollment_start AND sy.enrollment_end
    WHERE sy.school_year = school_year
  ) active_students ON s.student_id = active_students.student_id
  SET s.student_status = 'inactive'
  WHERE active_students.student_id IS NULL;
END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
