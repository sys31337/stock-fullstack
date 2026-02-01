import React, { ChangeEvent, useState } from 'react'
import { Switch } from '@web/shared/components/ui/switch'

interface CustomSwitchProps {
  defaultValue?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  colorScheme?: string; // Ignored for now
}

const CustomSwitch: React.FC<CustomSwitchProps> = (props) => {
  const { defaultValue, onChange } = props;
  const [value, setValue] = useState(defaultValue);

  const handleCheckedChange = (checked: boolean) => {
    setValue(checked);
    // Create a synthetic event to match the expected interface
    const syntheticEvent = {
      target: {
        value: checked
      }
    } as unknown as ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  }

  return (
    <Switch 
      checked={value} 
      onCheckedChange={handleCheckedChange} 
    />
  )
}

export default CustomSwitch