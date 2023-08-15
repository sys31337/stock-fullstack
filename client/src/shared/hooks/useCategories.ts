import axiosInstance from "@shared/services/api";
import queryClient from "@shared/services/queryClient";
import { Payload } from "@shared/types/payload";
import { useMutation, useQuery } from "@tanstack/react-query";

const useGetAllCategories = () => useQuery(
  ['Get all categories'],
  async () => axiosInstance
    .request({
      url: 'categories',
    })
    .then(({ data }) => data),
);

const useCreateCategory = () => useMutation((payload: Payload) => axiosInstance.request({
  method: 'POST',
  url: 'categories',
  data: payload,
}), { onSuccess: () => queryClient.invalidateQueries(['Get all categories']) });

export {
  useGetAllCategories,
  useCreateCategory
}
