import { AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList, AutoCompleteProps } from '@choc-ui/chakra-autocomplete';
import Any from '@shared/types/any';
import React from 'react'

interface CustomAutoCompleteProps extends Omit<AutoCompleteProps, 'children'> {
  filter: (query: string, optionValue: string, optionLabel: string) => boolean;
  onSelectOption: (s: Any) => void;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  items: Any[];
  onFocus?: () => Any;
  selector: string;
}

const CustomAutoComplete = (props: CustomAutoCompleteProps) => {
  const { filter, name, value, onSelectOption, onChange, items, selector, ...rest } = props;
  return (
    <AutoComplete openOnFocus rollNavigation {...rest} freeSolo={true} filter={filter} onSelectOption={onSelectOption}>
      <AutoCompleteInput
        textAlign={'center'}
        px={2}
        bg={'white'}
        borderColor={'gray.200'}
        borderRadius={'xl'}
        color={'theme.900'}
        type={'text'}
        name={name}
        autoComplete={'off'}
        value={value}
        onChange={onChange}
      />
      <AutoCompleteList>
        {items.map((item, k) => (
          <AutoCompleteItem
            key={`${[name]}-${k}`}
            value={item}
            label={item[selector]}
            textTransform="capitalize"
          >
            {item[selector]}
          </AutoCompleteItem>
        ))}
      </AutoCompleteList>
    </AutoComplete>
  )
}

export default CustomAutoComplete