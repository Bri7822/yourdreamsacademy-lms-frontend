import axios from 'axios'

class CourseService {
  constructor() {
    this.baseURL = '/api/student'
  }

  // Get all courses (for authenticated users)
  async getAllCourses() {
    try {
      const response = await axios.get(`${this.baseURL}/courses/`)
      return response.data
    } catch (error) {
      console.error('Error fetching all courses:', error)
      throw error
    }
  }

  // Get courses for home page (for all users)
  async getHomeCourses() {
    try {
      const response = await axios.get(`${this.baseURL}/home/courses/`)
      return response.data
    } catch (error) {
      console.error('Error fetching home courses:', error)
      throw error
    }
  }

  // Get guest courses
  async getGuestCourses() {
    try {
      const response = await axios.get(`${this.baseURL}/guest/courses/`)
      return response.data
    } catch (error) {
      console.error('Error fetching guest courses:', error)
      throw error
    }
  }

  // Get course details
  async getCourseDetail(courseCode) {
    try {
      const response = await axios.get(`${this.baseURL}/courses/${courseCode}/`)
      return response.data
    } catch (error) {
      console.error('Error fetching course detail:', error)
      throw error
    }
  }

  // Get guest course details
  async getGuestCourseDetail(courseCode, sessionId) {
    try {
      const response = await axios.get(`${this.baseURL}/guest/courses/${courseCode}/detail/`, {
        params: { session_id: sessionId }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching guest course detail:', error)
      throw error
    }
  }

  // Enroll in course
  async enrollInCourse(courseCode) {
    try {
      const response = await axios.post(`${this.baseURL}/courses/${courseCode}/enroll/`)
      return response.data
    } catch (error) {
      console.error('Error enrolling in course:', error)
      throw error
    }
  }

  // Get course lessons
  async getCourseLessons(courseCode) {
    try {
      const response = await axios.get(`${this.baseURL}/courses/${courseCode}/lessons/`)
      return response.data
    } catch (error) {
      console.error('Error fetching course lessons:', error)
      throw error
    }
  }

  // Get guest course lessons
  async getGuestCourseLessons(courseCode, sessionId) {
    try {
      const response = await axios.get(`${this.baseURL}/guest/courses/${courseCode}/lessons/`, {
        params: { session_id: sessionId }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching guest course lessons:', error)
      throw error
    }
  }
}

export default new CourseService()