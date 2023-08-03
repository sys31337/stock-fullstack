import React from 'react'
import { Input } from '@chakra-ui/react'

interface ProductInputProps {
  value: string | number;
  handleChange: (i: number, e) => void;
  index: number;
  type?: string;
  name: string;
  bg?: string;
  readOnly?: boolean;
}
const ProductInput = (props: ProductInputProps) => {
  const { value, handleChange, index, type, name, bg, ...rest } = props;
  return (
    <Input
      // onKeyPress={onKeyPress}
      textAlign={'center'}
      px={2}
      bg={bg || 'white'}
      borderColor={'gray.200'}
      borderRadius={'xl'}
      color={'theme.900'}
      type={type || 'text'}
      name={name}
      defaultValue={value}
      onChange={(e) => (handleChange(index, e))}
      {...rest}
    />
  )
}

export default ProductInput