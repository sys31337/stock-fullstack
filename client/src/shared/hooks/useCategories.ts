import axiosInstance from "@shared/services/api";
import { useQuery } from "@tanstack/react-query";

const useGetAllCategories = () => useQuery(
  ['Get all categories'],
  async () => axiosInstance
    .request({
      url: 'categories',
    })
    .then(({ data }) => data),
);

export {
  useGetAllCategories,
}
