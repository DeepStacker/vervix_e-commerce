import axios from 'axios';

const adminApi = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
});

// Set token from localStorage if available
const token = localStorage.getItem('adminToken');
if (token) {
  adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default adminApi; 