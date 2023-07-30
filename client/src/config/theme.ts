import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  components: {
    Input: {
      baseStyle: {
        field: {
          w: "-webkit-fill-available",
          my: 1,
          mb: 3,
        }
      }
    },
  },
  fonts: {
    heading: '\'Montserrat\', sans-serif',
    body: '\'Roboto\', sans-serif',
  },
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '960px',
    xl: '1200px',
    '2xl': '1536px',
  },
});

export default theme;
