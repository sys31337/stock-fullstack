import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultId } from '@web/config';
import axiosInstance from '@web/shared/services/api';
import queryClient from '@web/shared/services/queryClient';
import { Payload } from '@web/shared/types/payload';

import Any from '@web/shared/types/any';

const useGetAllCategories = () => useQuery(
  ['Get all categories'],
  async () => axiosInstance
    .request({
      url: 'categories',
    })
    .then(({ data }) => {
      const defaultCategory = data.find((category: Any) => category._id === defaultId);
      const restOfCategorys = data.filter((category: Any) => category._id !== defaultId);
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
