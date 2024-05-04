import React from 'react'
import { Button, Flex, Td, Tr, useToast } from '@chakra-ui/react'
import CustomSwitch from '@web/shared/components/CustomSwitch';
import showToast from '@web/shared/functions/showToast';
import { price } from '@web/shared/functions/words';
import { useUpdateProduct } from '@web/shared/hooks/useProducts';
import { IProduct } from '@web/shared/types/product';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { AiFillDelete, AiFillEdit } from 'react-icons/ai';

interface ProductRowProps {
  product: IProduct;
}

const ProductRow: React.FC<ProductRowProps> = ({ product }) => {
  const { _id, barCode, productName, buyPrice, quantity, stack, tva, sellPrice_1, sellPrice_2, sellPrice_3, notify } = product;
  const { mutateAsync: setNotification } = useUpdateProduct(_id);
  const toast = useToast();

  const onNotifyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: notify } = e.target
    try {
      const payload = {
        notify
      }
      await setNotification(payload);
      showToast(
        toast,
        { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success', duration: 1000 },
      );
    } catch (err) {
      const error = err as AxiosError;
      showToast(
        toast,
        { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText} - Please try again later`, status: 'error' },
      );

    }
  }

  return (
    <Tr key={_id}>
      <Td>{barCode}</Td>
      <Td>{productName}</Td>
      <Td>{`${quantity} × ${stack}`}</Td>
      <Td>{price(buyPrice)} DA</Td>
      <Td>%{tva}</Td>
      <Td>{price(sellPrice_1)} DA</Td>
      <Td>{price(sellPrice_2)} DA</Td>
      <Td>{price(sellPrice_3)} DA</Td>
      <Td textAlign={'center'}>
        <CustomSwitch colorScheme='teal' defaultValue={notify} onChange={onNotifyChange} />
      </Td>
      <Td>
        <Flex gap={1} justifyContent={'flex-end'}>
          <Button colorScheme='green' p={0} size={'sm'} fontWeight={400} borderRadius={'2xl'} as={'a'} href={`/editbill/${_id}`}>
            <AiFillEdit />
          </Button>
          <Button colorScheme='red' p={0} size={'sm'} fontWeight={400} borderRadius={'2xl'}>
            <AiFillDelete />
          </Button>
        </Flex>
      </Td>
    </Tr>
  )
}

export default ProductRow