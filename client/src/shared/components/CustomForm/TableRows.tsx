import React, { useState } from 'react';
import { Tr, Td, Input, Button, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { BiTrash } from 'react-icons/bi';
import { BsPercent } from 'react-icons/bs';

const TableRows = ({ index, data, products, deleteTableRows, handleChange, handleBlur }) => {
  const [total, setTotal] = useState(0);
  const updateTotal = (e) => {
    handleChange(index, e)
    const { quantity, stack, buyPrice, tva } = data;
    const total = parseInt(quantity || 0, 10) * parseInt(stack || 0, 10) * parseInt(buyPrice || 0, 10)
    const productTva = total * tva / 100;
    setTotal(total - productTva)
  }
  const { id, barCode, tva, productName, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3 } = data;

  return (
    <Tr key={id}>
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
          defaultValue={buyPrice}
          onChange={(e) => (updateTotal(e))}
          onBlur={(e) => handleBlur(index, e)}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={(parseInt(sellPrice_1, 10) < parseInt(buyPrice, 10) && parseInt(sellPrice_1, 10) !== 0)
            ? 'red.100'
            : ((parseInt(sellPrice_1, 10) === parseInt(buyPrice, 10) && parseInt(sellPrice_1, 10) !== 0)
              ? 'yellow.100'
              : 'white')}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="sellPrice_1"
          defaultValue={sellPrice_1}
          onBlur={(e) => handleBlur(index, e)}
          onChange={(e) => handleChange(index, e)}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={(parseInt(sellPrice_2, 10) < parseInt(buyPrice, 10) && parseInt(sellPrice_2, 10) !== 0)
            ? 'red.100'
            : ((parseInt(sellPrice_2, 10) === parseInt(buyPrice, 10) && parseInt(sellPrice_2, 10) !== 0)
              ? 'yellow.100'
              : 'white')}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="sellPrice_2"
          defaultValue={sellPrice_2}
          onBlur={(e) => handleBlur(index, e)}
          onChange={(e) => handleChange(index, e)}
        />
      </Td>
      <Td px={1}>
        <Input
          textAlign={'center'}
          px={2}
          bg={(parseInt(sellPrice_3, 10) < parseInt(buyPrice, 10) && parseInt(sellPrice_3, 10) !== 0)
            ? 'red.100'
            : ((parseInt(sellPrice_3, 10) === parseInt(buyPrice, 10) && parseInt(sellPrice_1, 10) !== 0)
              ? 'yellow.100'
              : 'white')}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="sellPrice_3"
          defaultValue={sellPrice_3}
          onBlur={(e) => handleBlur(index, e)}
          onChange={(e) => handleChange(index, e)}
        />
      </Td>
      <Td px={1}>
        <InputGroup>
          <InputLeftElement pointerEvents='none' ps={2} w={'2ch'}>
            <BsPercent color='gray' />
          </InputLeftElement>
          <Input
            // textAlign={'center'}
            p={'0 0 0 25px'}
            // px={0}
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
        <Input
          textAlign={'center'}
          px={2}
          variant={'unstyled'}
          _focusVisible={{
            boxShadow: 'unset',
            border: 'unset'
          }}
          borderColor={'gray.200'}
          borderRadius={'xl'}
          color={'theme.900'}
          type={'number'}
          name="total"
          isReadOnly={true}
          value={parseFloat(total as unknown as string).toFixed(2)}
        />
      </Td>
    </Tr>)
}

export default TableRows;