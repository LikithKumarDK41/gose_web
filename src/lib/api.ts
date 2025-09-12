// src/lib/api.ts
import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  // You can set a base URL for your API here
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the token and language to headers
api.interceptors.request.use(
  (config) => {
    // Check if window is defined (i.e., we are on the client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('user');
      const language = localStorage.getItem('locale') || 'en'; // Or get it from your locale provider context

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      config.headers['Accept-Language'] = language;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (typeof window !== 'undefined' && error.response && error.response.status === 401) {
      // Handle 401 error
      localStorage.removeItem('user');
      // Redirect to login page
      // You might want to show a toast message to the user before redirecting
      window.location.href = '/login'; 
      console.error('Unauthorized access - redirecting to login.');
    }
    return Promise.reject(error);
  }
);

export default api;
