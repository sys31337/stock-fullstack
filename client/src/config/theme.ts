import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    transparent: 'transparent',
    black: '#000',
    white: {
      900: '#FAf8fA',
      100: '#CDCDDE',
    },
    theme: {
      900: '#000',
      800: '#333',
      300: '#F9FAFB',
      200: '#F9FAFB',
      100: '#425166',
    },
    yellow: {
      900: '#FDE720',
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
