import axiosInstance from "@shared/services/api";
import queryClient from "@shared/services/queryClient";
import { Payload } from "@shared/types/payload";
import { useMutation, useQuery } from "@tanstack/react-query";
const defaultId = '0a0aaa0a0aa00000aaaaaa0a';

const useGetAllCategories = () => useQuery(
  ['Get all categories'],
  async () => axiosInstance
    .request({
      url: 'categories',
    })
    .then(({ data }) => {
      const defaultCategory = data.find((category) => category._id === defaultId);
      const restOfCategorys = data.filter((category) => category._id !== defaultId);
      return [defaultCategory, ...restOfCategorys];
    }),
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
