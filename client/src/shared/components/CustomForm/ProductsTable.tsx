import React from "react"
import TableRows from "./TableRows";
import { Button, Table, TableCaption, TableContainer, Tbody, Th, Thead, Tr } from "@chakra-ui/react";
import { t } from "i18next";
import { BiTrash } from "react-icons/bi";
import { randomId } from "@shared/functions/words";

const decimalInputs = ['sellPrice_1', 'sellPrice_2', 'sellPrice_3', 'buyPrice', 'total']

const ProductsTable = ({ productsValues, setProductsValues }) => {
  const addTableRows = () => {
    const rowsInput = {
      id: randomId(),
      barCode: '',
      productName: '',
      quantity: 0,
      stack: 0,
      buyPrice: 0,
      sellPrice_1: 0,
      sellPrice_2: 0,
      sellPrice_3: 0,
    }
    setProductsValues([...productsValues, rowsInput])
  }
  const deleteTableRows = (id) => {
    const index = productsValues.findIndex((item) => item.id === id)
    setProductsValues(productsValues.filter((_p, k) => k !== index));
  }

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const rowsInput = [...productsValues];
    rowsInput[index][name] = decimalInputs.includes(name) ? parseFloat(value || 0).toFixed(2) : value;
    setProductsValues(rowsInput);
  }

  const handleBlur = (index, e) => {
    const { name, value } = e.target;
    e.target.value = decimalInputs.includes(name) ? parseFloat(value || 0).toFixed(2) : value;
  }

  return (
    <>
      <TableContainer>
        <Table variant='simple'>
          <TableCaption><Button colorScheme={'green'} onClick={addTableRows} borderRadius={'full'} px={10}>{t('addProduct')}</Button></TableCaption>
          <Thead>
            <Tr>
              <Th textAlign={'left'} w={'10px'}><BiTrash size={16} /></Th>
              <Th textAlign={'center'} w={'24ch'}>{t('barCode')}</Th>
              <Th textAlign={'center'}>{t('designation')}</Th>
              <Th textAlign={'center'} w={'14ch'}>{t('quantity')}</Th>
              <Th textAlign={'center'} w={'10ch'}>{t('units')}</Th>
              <Th textAlign={'center'} w={'16ch'}>{t('buyPrice')}</Th>
              <Th textAlign={'center'} w={'16ch'} color={'red.500'}>{t('sellPrice_1')}</Th>
              <Th textAlign={'center'} w={'16ch'} color={'blue.500'}>{t('sellPrice_2')}</Th>
              <Th textAlign={'center'} w={'16ch'} color={'green.500'}>{t('sellPrice_3')}</Th>
              <Th textAlign={'center'} w={'20ch'}>{t('total')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              productsValues.map((data, index) => (
                <TableRows
                  index={index}
                  key={index}
                  products={productsValues}
                  data={data}
                  deleteTableRows={deleteTableRows}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                />
              ))
            }
          </Tbody>
        </Table>
      </TableContainer>
    </>
  )
}
export default ProductsTable
