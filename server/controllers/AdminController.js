// src/controllers/AdminController.js
import AdminModel from "../models/AdminModel";
import Cookies from "js-cookie";
import { exportToExcel } from "../utils/excelExport";

class AdminController {
  constructor(setCourses, setStudents, setInstructors, setError, setLoading, navigate, toast) {
    this.setCourses = setCourses;
    this.setStudents = setStudents;
    this.setInstructors = setInstructors;
    this.setError = setError;
    this.setLoading = setLoading;
    this.navigate = navigate;
    this.toast = toast;
  }

  async loadData() {
    try {
      const [courses, students, instructors] = await Promise.all([
        AdminModel.fetchAllCourses(),
        AdminModel.fetchAllStudents(),
        AdminModel.fetchAllInstructors(),
      ]);
      this.setCourses(courses);
      this.setStudents(students);
      this.setInstructors(instructors);
    } catch (err) {
      this.setError(err.message || "Failed to load data");
      const token = Cookies.get("token");
      if (!token || err.response?.status === 401 || err.response?.status === 403) {
        this.navigate("/login");
      }
    } finally {
      this.setLoading(false);
    }
  }

  handleLogout() {
    Cookies.remove("token");
    this.navigate("/login");
  }

  async handleBlockUser(userId, type, isBlocked) {
    try {
      if (isBlocked) {
        await AdminModel.unblockUser(userId, type);
        this.toast.success(`${type} unblocked successfully!`);
      } else {
        await AdminModel.blockUser(userId, type);
        this.toast.success(`${type} blocked successfully!`);
      }
      // Refresh data
      const updatedStudents = await AdminModel.fetchAllStudents();
      const updatedInstructors = await AdminModel.fetchAllInstructors();
      this.setStudents(updatedStudents);
      this.setInstructors(updatedInstructors);
    } catch (error) {
      this.toast.error(`Failed to ${isBlocked ? "unblock" : "block"} ${type}!`);
    }
  }

  generateStudentReport(students, courses) {
    const data = students.map(student => ({
      "Student ID": student._id,
      "Name": `${student.firstName} ${student.lastName}`,
      "Email": student.email,
      "Courses": courses
        .filter(course => course.students.some(s => s.studentId.toString() === student._id))
        .map(course => `${course.name} (${course._id})`)
        .join(", "),
    }));
    exportToExcel(data, "Students_Report");
    this.toast.success("Student report generated!");
  }

  generateInstructorReport(instructors, courses) {
    const data = instructors.map(instructor => ({
      "Instructor ID": instructor._id,
      "Name": `${instructor.firstName} ${instructor.lastName}`,
      "Courses": courses
        .filter(course => course.instructor && course.instructor._id.toString() === instructor._id)
        .map(course => `${course.name} (${course._id})`)
        .join(", "),
    }));
    exportToExcel(data, "Instructors_Report");
    this.toast.success("Instructor report generated!");
  }

  generateCourseReport(courses) {
    const data = courses.map(course => ({
      "Course ID": course._id,
      "Name": course.name,
      "Student Count": course.students.length,
    }));
    exportToExcel(data, "Courses_Report");
    this.toast.success("Course report generated!");
  }

  filterStudentsByCourse(students, courses, courseId) {
    if (!courseId) return students;
    return students.filter(student =>
      courses.some(course =>
        course._id === courseId && course.students.some(s => s.studentId.toString() === student._id)
      )
    );
  }

  filterInstructorsByCourse(instructors, courses, courseId) {
    if (!courseId) return instructors;
    return instructors.filter(instructor =>
      courses.some(course => course._id === courseId && course.instructor && course.instructor._id.toString() === instructor._id)
    );
  }
}

export default AdminController;