import React, { useEffect, useState } from 'react';
import { Tr, Td, Input, Button, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { BiTrash } from 'react-icons/bi';
import { BsPercent } from 'react-icons/bs';
import { price } from '@shared/functions/words';
import CustomInput from './Input';
import { AutoComplete, AutoCompleteInput, AutoCompleteList, AutoCompleteItem } from '@choc-ui/chakra-autocomplete';
import { useGetAllProducts } from '@shared/hooks/useProducts';

const TableRows = ({ index, data, products, deleteTableRows, handleChange, handleBlur }) => {
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [productName, setProductName] = useState('');
  const { data: allProducts, isFetched } = useGetAllProducts();

  useEffect(() => {
    const total = parseInt(data.quantity || 0, 10) * parseInt(data.stack || 0, 10) * parseInt(data.buyPrice || 0, 10)
    const productTva = total * data.tva / 100;
    setProductName(data.productName)
    setTotalHT(total)
    setTotalTTC(total + productTva)
  }, [data])

  const productsList = products.map((product) => product.productName.toLowerCase());

  const filterProductsList = (query: string, _optionValue: string, optionLabel: string) => optionLabel.toLowerCase().includes(query.toLowerCase()) && !productsList.includes(optionLabel.toLowerCase())

  const updateTotal = (e) => {
    handleChange(index, e)
    const { quantity, stack, buyPrice, tva } = data;
    const total = parseInt(quantity || 0, 10) * parseInt(stack || 0, 10) * parseInt(buyPrice || 0, 10)
    const productTva = total * tva / 100;
    data.totalHT = total;
    data.totalTTC = total + productTva;
    setTotalHT(total);
    setTotalTTC(total + productTva);
  }
  const { id, barCode, tva, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3 } = data;

  const selectProduct = (selectedItems) => {
    const { id, barCode, productName, tva, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3 } = selectedItems.item.originalValue;
    data.id = id;
    data.barCode = barCode;
    data.productName = productName;
    data.tva = tva;
    data.stack = stack;
    data.buyPrice = buyPrice;
    data.sellPrice_1 = sellPrice_1;
    data.sellPrice_2 = sellPrice_2;
    data.sellPrice_3 = sellPrice_3;
    setTotalHT(0);
    setTotalTTC(0);
  };

  return (
    <>
      {isFetched && (
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
            <AutoComplete rollNavigation freeSolo={true} filter={filterProductsList} onSelectOption={(selectedItems) => {
              const e = { target: { name: 'productName', value: selectedItems.item.label } };
              handleChange(index, e);
              setProductName(selectedItems.item.label);
              selectProduct(selectedItems);
            }}>
              <AutoCompleteInput
                textAlign={'center'}
                px={2}
                bg={'white'}
                borderColor={'gray.200'}
                borderRadius={'xl'}
                color={'theme.900'}
                type={'text'}
                name={'productName'}
                autoComplete={'off'}
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value as unknown as string);
                  handleChange(index, e);
                }}
              />
              <AutoCompleteList>
                {allProducts.map((product) => (
                  <AutoCompleteItem
                    key={`product-${product._id}`}
                    value={product}
                    label={product.productName}
                    textTransform="capitalize"
                  >
                    {product.productName}
                  </AutoCompleteItem>
                ))}
              </AutoCompleteList>
            </AutoComplete>
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
              type={'number'}
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
              _focusVisible={{
                boxShadow: 'unset',
                border: 'unset'
              }}
              bg={'transparent'}
              border={0}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="totalHT"
              isReadOnly={true}
              value={price(`${totalHT}`)}
              currency='DZD'
            />
          </Td>
          <Td px={1}>
            <CustomInput
              textAlign={'center'}
              px={2}
              _focusVisible={{
                boxShadow: 'unset',
                border: 'unset'
              }}
              bg={'transparent'}
              border={0}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="totalTTC"
              isReadOnly={true}
              value={price(`${totalTTC}`)}
              currency='DZD'
            />
          </Td>
        </Tr>
      )}
    </>
  )
}

export default TableRows;