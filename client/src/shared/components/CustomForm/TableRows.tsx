import React, { useState } from 'react';
import { Tr, Td, Input, Button, Flex } from '@chakra-ui/react';
import { BiTrash } from 'react-icons/bi';

const TableRows = ({ index, data, products, deleteTableRows, handleChange }) => {
  const [total, setTotal] = useState(0);
  const updateTotal = (index, e) => {
    handleChange(index, e)
    const product = data;
    const { quantity, stack, buyPrice } = product;
    setTotal(parseInt(quantity || 0, 10) * parseInt(stack || 0, 10) * parseInt(buyPrice || 0, 10))
  }
  const { barCode, productName, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3 } = data;
  const handleKeyPress = (event) => {
    // console.log(event)
    if (event.key === 'Enter') {
      // console.log('enter press here! ')
    }
  }
  return (
    <Tr key={index}>
      <Td px={1}>
        <Flex gap={2}>
          {(index !== 0 || products.length > 1) && (
            <Button w={10} px={0} variant={'ghost'} onClick={() => (deleteTableRows(index))}>
              <BiTrash color={'red'} />
            </Button>
          )}
          <Input
            onKeyPress={handleKeyPress}
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
        </Flex>
      </Td>
      <Td px={1}>
        <Input
          onKeyPress={handleKeyPress}
          autoFocus={index === 0 && products.length === 1}
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
          onKeyPress={handleKeyPress}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="quantity"
          defaultValue={quantity}
          onChange={(e) => (updateTotal(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          onKeyPress={handleKeyPress}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="stack"
          defaultValue={stack}
          onChange={(e) => (updateTotal(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          onKeyPress={handleKeyPress}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="buyPrice"
          defaultValue={buyPrice}
          onChange={(e) => (updateTotal(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          onKeyPress={handleKeyPress}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="sellPrice_1"
          defaultValue={sellPrice_1}
          onChange={(e) => (handleChange(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          onKeyPress={handleKeyPress}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="sellPrice_2"
          defaultValue={sellPrice_2}
          onChange={(e) => (handleChange(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          onKeyPress={handleKeyPress}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          name="sellPrice_3"
          defaultValue={sellPrice_3}
          onChange={(e) => (handleChange(index, e))}
        />
      </Td>
      <Td px={1}>
        <Input
          onKeyPress={handleKeyPress}
          textAlign={'center'}
          px={2}
          bg={'white'}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'text'}
          readOnly={true}
          name="total"
          value={total}
        />
      </Td>
    </Tr>)
}

export default TableRows;