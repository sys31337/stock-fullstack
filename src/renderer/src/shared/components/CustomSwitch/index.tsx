import React, { ChangeEvent, useState } from 'react'
import { Switch, SwitchProps } from '@chakra-ui/react'

interface CustomSwitchProps extends Omit<SwitchProps, 'defaultValue'> {
  defaultValue?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const CustomSwitch: React.FC<CustomSwitchProps> = (props) => {
  const { defaultValue, onChange, ...rest } = props;
  const [value, setValue] = useState(defaultValue);
  return (
    <Switch {...rest} defaultChecked={value} value={`${!value}`} size='lg' onChange={(e) => {
      setValue((prev) => !prev);
      onChange(e);
    }} />
  )
}

export default CustomSwitch