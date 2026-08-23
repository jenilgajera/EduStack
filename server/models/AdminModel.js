// src/models/AdminModel.js
import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

class AdminModel {
  static async fetchAllCourses() {
    try {
      const response = await api.get("/courses");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fetchAllStudents() {
    try {
      const response = await api.get("/students"); // New endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fetchAllInstructors() {
    try {
      const response = await api.get("/instructors"); // New endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async blockUser(userId, type) {
    try {
      const response = await api.put(`/users/block/${userId}`, { type }); // New endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async unblockUser(userId, type) {
    try {
      const response = await api.put(`/users/unblock/${userId}`, { type }); // New endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async fetchUserByEmail(email) {
    try {
      const response = await api.get(`/users/email/${email}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default AdminModel;