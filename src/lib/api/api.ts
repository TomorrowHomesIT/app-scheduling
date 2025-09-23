import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const apiUrl = `${import.meta.env.VITE_PUBLIC_API_URL}/api`;

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } = await createClient().auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
