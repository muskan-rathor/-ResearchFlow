
import { api } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    data
  );

  return response.data.data;
};
