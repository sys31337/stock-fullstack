import React, { useState } from 'react';
import { Tr, Td, Input, Button, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { BiTrash } from 'react-icons/bi';
import { BsPercent } from 'react-icons/bs';
import { price } from '@shared/functions/words';
import CustomInput from './Input';

const TableRows = ({ index, data, products, deleteTableRows, handleChange, handleBlur }) => {
  const [total, setTotal] = useState(0);
  const updateTotal = (e) => {
    handleChange(index, e)
    const { quantity, stack, buyPrice, tva } = data;
    const total = parseInt(quantity || 0, 10) * parseInt(stack || 0, 10) * parseInt(buyPrice || 0, 10)
    const productTva = total * tva / 100;
    setTotal(total + productTva)
  }
  const { id, barCode, tva, productName, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3 } = data;

  return (
    <Tr key={id}>
      <Td color={'theme.900'}>
        {index + 1}
      </Td>
      <Td p={0} w={'5px'} textAlign={'center'}>
        {(index !== 0 || products.length > 1) && (
          <Button px={0} variant={'ghost'} onClick={() => (deleteTableRows(id))}>
            <BiTrash color={'red'} />
          </Button>
        )}
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="barCode"
          defaultValue={barCode}
          onChange={(e) => (handleChange(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          autoFocus={id === 0}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="productName"
          defaultValue={productName}
          onChange={(e) => (handleChange(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="quantity"
          defaultValue={quantity}
          onChange={(e) => (updateTotal(e))}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="stack"
          defaultValue={stack}
          onChange={(e) => (updateTotal(e))}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="buyPrice"
          defaultValue={price(buyPrice)}
          onChange={(e) => (updateTotal(e))}
          onBlur={(e) => handleBlur(e)}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={(Number(sellPrice_1) < Number(buyPrice) && Number(sellPrice_1) !== 0)
            ? 'red.100'
            : ((Number(sellPrice_1) === Number(buyPrice) && Number(sellPrice_1) !== 0)
              ? 'yellow.100'
              : 'white')}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="sellPrice_1"
          defaultValue={price(sellPrice_1)}
          onBlur={(e) => handleBlur(e)}
          onChange={(e) => handleChange(index, e)}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={(Number(sellPrice_2) < Number(buyPrice) && Number(sellPrice_2) !== 0)
            ? 'red.100'
            : ((Number(sellPrice_2) === Number(buyPrice) && Number(sellPrice_2) !== 0)
              ? 'yellow.100'
              : 'white')}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="sellPrice_2"
          defaultValue={price(sellPrice_2)}
          onBlur={(e) => handleBlur(e)}
          onChange={(e) => handleChange(index, e)}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={(Number(sellPrice_3) < Number(buyPrice) && Number(sellPrice_3) !== 0)
            ? 'red.100'
            : ((Number(sellPrice_3) === Number(buyPrice) && Number(sellPrice_3) !== 0)
              ? 'yellow.100'
              : 'white')}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="sellPrice_3"
          defaultValue={price(sellPrice_3)}
          onBlur={(e) => handleBlur(e)}
          onChange={(e) => handleChange(index, e)}
        />
      </Td>
      <Td px={1}>
        <InputGroup>
          <InputLeftElement pointerEvents='none' ps={2} w={'2ch'}>
            <BsPercent color='gray' />
          </InputLeftElement>
          <Input
            p={'0 0 0 25px'}
            bg={'white'}
            borderColor={'gray.200'}
            borderRadius={'xl'}
            color={'theme.900'}
            type={'number'}
            name="tva"
            defaultValue={tva}
            onChange={(e) => (updateTotal(e))}
          />
        </InputGroup>
      </Td>
      <Td px={1}>
        <CustomInput
          textAlign={'center'}
          px={2}
          // variant={'unstyled'}
          _focusVisible={{
            boxShadow: 'unset',
            border: 'unset'
          }}
          bg={'transparent'}
          border={0}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="total"
          isReadOnly={true}
          value={price(`${total}`)}
          currency='DZD'
        />

        {/* <CustomInput
          flex={1}
          name="orderDebts"
          label="Order Debts"
          icon={FcDebt}
          handleChange={handleChange}
          handleBlur={handleBlur}
          defaultValue={orderDebts}
          value={orderDebts}
          errorMessage={errors.orderDebts && touched.orderDebts && errors.orderDebts}
          currency='DZD'
        /> */}

      </Td>
    </Tr>)
}

export default TableRows;