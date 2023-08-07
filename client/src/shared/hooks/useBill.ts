import axiosInstance from "@shared/services/api";
import { useMutation } from "@tanstack/react-query";

export const useCreateBill = () => useMutation((data) => axiosInstance.request({
  method: 'POST',
  url: 'bills',
  data,
}));