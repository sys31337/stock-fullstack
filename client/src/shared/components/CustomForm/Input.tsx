import React, { ReactNode } from 'react';
import {
  Text, FormControl, FormLabel, Input, Textarea, InputGroup, InputLeftElement, Icon, As,
} from '@chakra-ui/react';
import Any from '@shared/types/any';
import { Select } from 'chakra-react-select';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import "./styles.css"

interface SelectOptions {
  value: string;
  label: string
}

type CustomInputProps = {
  name: string;
  label: string;
  type?: string;
  handleChange?: (e: React.ChangeEvent<Any>) => void;
  setFieldValue?: (fieldName: string, value: Date | string) => void;
  handleBlur?: (e: React.ChangeEvent<Any>) => void;
  defaultValue: string | Date | number;
  errorMessage?: ReactNode;
  isTextArea?: boolean;
  isDate?: boolean;
  isSelect?: boolean;
  icon?: As;
  selectOptions?: SelectOptions[]
}

const CustomInput = (props: CustomInputProps) => {
  const {
    name, label, type, handleChange, handleBlur, defaultValue, errorMessage, isTextArea, isSelect, isDate, selectOptions, setFieldValue, icon, ...rest
  } = props;

  const OnSelectChange = (payload) => {
    const { value } = payload;
    setFieldValue && setFieldValue(name, value);
  };

  return (
    <FormControl id={name}>
      <FormLabel color={errorMessage ? 'red' : 'theme.900'} my={2}>
        {label}
        {errorMessage && (
          <Text as={'span'} color={'red'} ms={1}>*</Text>
        )}
      </FormLabel>
      {isSelect ? (
        <Select
          isSearchable={true}
          name={name}
          options={selectOptions as Any}
          placeholder={label}
          size={'md'}
          closeMenuOnSelect={true}
          onChange={OnSelectChange}
          defaultValue={defaultValue}
          chakraStyles={{
            control: (provided) => ({
              ...provided,
              borderRadius: 'xl',
              bg: 'white'
            }),
            dropdownIndicator: (provided) => ({
              ...provided,
              color: 'theme.900',
              w: '32px',
              bg: 'white'
            }),
            menu: (provided) => ({
              ...provided,
              color: 'theme.900',
            }),
            menuList: (provided) => ({
              ...provided,
              p: 0,
              borderRadius: 'xl'
            }),
            singleValue: (provided) => ({
              ...provided,
              color: 'theme.900'
            })
          }}
          classNamePrefix='chakra-react-select'
          colorScheme='purple'
        />
      ) : (isDate ? (
        <SingleDatepicker
          configs={{
            dateFormat: 'dd/MM/yyyy',
          }}
          propsConfigs={{
            popoverCompProps: {
              popoverContentProps: {
                background: 'white',
                color: 'blue.500',
              },
            },
            inputProps: {
              borderRadius: 'xl',
              bg: 'white',
              color: 'theme.900'
            }
          }}
          date={defaultValue as Date}
          onDateChange={(date) => setFieldValue && setFieldValue(name, date)}
          {...rest}
        />
      ) : (
        <InputGroup>
          {icon && (
            <InputLeftElement pointerEvents='none' m={'auto'}>
              <Icon as={icon} color={'gray'} size={24} />
            </InputLeftElement>
          )}
          <Input
            as={isTextArea ? Textarea as Any : Input}
            type={type || 'text'}
            pl={icon ? 9 : 3}
            name={name}
            size={'md'}
            bg={'white'}
            color={'theme.900'}
            borderRadius={'xl'}
            borderColor={errorMessage ? 'red' : 'theme.600'}
            _focus={{
              bg: 'gray.50',
              boxShadow: 'none !important',
            }}
            onChange={handleChange}
            onBlur={handleBlur}
            defaultValue={defaultValue as string | number}
            {...rest}
          />
        </InputGroup>
      ))
      }
    </FormControl >
  );
};

export default CustomInput;
