// src/models/AdminModel.js
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "../Utility/api";

class AdminModel {
  static async fetchAllCourses() {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.email !== "admin@example.com") throw new Error("Unauthorized: Not an admin");

      const response = await api.get("/admin/courses");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fetchAllStudents() {
    try {
      const response = await api.get("/admin/students");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fetchAllInstructors() {
    try {
      const response = await api.get("/admin/instructors");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async blockUser(userId, type) {
    try {
      const response = await api.put(`/admin/users/block/${userId}`, { type });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async unblockUser(userId, type) {
    try {
      const response = await api.put(`/admin/users/unblock/${userId}`, { type });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // static async updateCourse(courseId, data) {
  //   try {
  //     const response = await api.put(`/admin/courses/${courseId}`, data);
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async updateCourse(courseId, data) {
    try {
      console.log('Sending to server:', data);
      const response = await api.put(`/admin/courses/${courseId}`, data);
      console.log('Model response:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('Client Error:', error.response?.data || error.message);
      throw error;
    }
  }
    
  static async deleteCourse(courseId) {
    try {
      const response = await api.delete(`/admin/courses/${courseId}`); // Same endpoint, but server handles admin logic
      return response.data;
    } catch (error) {
      console.error('Delete error:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }
}

export default AdminModel;