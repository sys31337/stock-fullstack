import React from 'react';
import { AutoComplete, AutoCompleteInput, AutoCompleteList, AutoCompleteItem, AutoCompleteProps } from '@choc-ui/chakra-autocomplete';
import Any from '@web/shared/types/any';
import { Box } from '@chakra-ui/react';

interface CustomAutoCompleteProps extends Omit<AutoCompleteProps, 'children'> {
  filter: (query: string, optionValue: string, optionLabel: string) => boolean;
  onSelectOption: (s: Any) => void;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  items: Any[];
  onFocus?: () => Any;
  selector: string;
  inputProps?: { [key: string]: Any }
}

const CustomAutoComplete = (props: CustomAutoCompleteProps) => {
  const { filter, name, value, onSelectOption, onChange, items, inputProps, selector, ...rest } = props;
  return (
    <AutoComplete rollNavigation={false} openOnFocus {...rest} freeSolo={true} filter={filter} onSelectOption={onSelectOption} emphasize={true}>
      <AutoCompleteInput
        textAlign={'center'}
        px={2}
        bg={'white'}
        borderColor={'gray.200'}
        borderRadius={'xl'}
        color={'theme.900'}
        type={'text'}
        name={name}
        autoFocus={false}
        {...inputProps}
        autoComplete={'off'}
        value={value}
        onChange={onChange}
      />
      {items.length > 0 && (
        <AutoCompleteList>
          <AutoCompleteItem
            disabled={true}
            fixed={true}
            style={{
              display: 'none'
            }}
            value={'disabled'}
          >
            disabled
          </AutoCompleteItem>
          {items.map((item, k) => (
            <Box key={k}>
              <AutoCompleteItem
                defaultChecked={false}
                value={item}
                label={item[selector]}
              >
                {item[selector]}
              </AutoCompleteItem>
            </Box>
          ))}
        </AutoCompleteList>
      )}
    </AutoComplete>
  )
}

export default CustomAutoComplete