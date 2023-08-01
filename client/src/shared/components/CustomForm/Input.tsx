import React, { ReactNode } from 'react';
import {
  Box, Text, FormControl, FormLabel, Input, Textarea, BoxProps, Select,
} from '@chakra-ui/react';
import Any from '@shared/types/any';

type CustomInputProps = BoxProps & {
  name: string;
  label: string;
  type?: string;
  handleChange: (e: React.ChangeEvent<Any>) => void;
  handleBlur: (e: React.ChangeEvent<Any>) => void;
  defaultValue: string | number;
  errorMessage?: ReactNode;
  isTextArea?: boolean;
  isSelect?: boolean;
  children?: ReactNode
}

const CustomInput = (props: CustomInputProps) => {
  const {
    name, label, type, handleChange, handleBlur, defaultValue, errorMessage, isTextArea, isSelect, children, ...rest
  } = props;
  return (
    <Box {...rest}>
      <FormControl id={name}>
        <FormLabel color={errorMessage ? 'red' : ''}>
          {label}
          {errorMessage && (
            <Text as={'span'} color={'red'} ms={1}>*</Text>
          )}
        </FormLabel>
        {isSelect ? (
          <Select
            onChange={handleChange}
            name={name}
            size={'lg'}
            bg={'theme.700'}
            borderRadius={'xl'}
            borderColor={errorMessage ? 'red' : 'theme.600'}
            _focus={{
              bg: 'theme.900',
              boxShadow: 'none !important',
            }}
            onBlur={handleBlur}
            defaultValue={defaultValue}
          >
            {children}
          </Select>
        ) : (
          <Input
            as={isTextArea ? Textarea as Any : Input}
            type={type || 'text'}
            name={name}
            size={'lg'}
            bg={'theme.700'}
            borderRadius={'xl'}
            borderColor={errorMessage ? 'red' : 'theme.600'}
            _focus={{
              bg: 'theme.900',
              boxShadow: 'none !important',
            }}
            onChange={handleChange}
            onBlur={handleBlur}
            defaultValue={defaultValue} />
        )}
      </FormControl>
    </Box >
  );
};

export default CustomInput;
