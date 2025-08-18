import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles/createTheme' {
  interface Theme {
    kale: {
      headers: {
        main: string;
      };
    };
  }
  // allow configuration using `createMuiTheme`
  interface ThemeOptions {
    kale?: {
      headers?: {
        main?: string;
      };
    };
  }
}

export const theme = createTheme({
  palette: {
    secondary: {
      main: '#753BBD',
      dark: '#512984',
      light: '#9062ca',
    },
    primary: {
      main: '#2e82d7',
      dark: '#205b96',
      light: '#579bdf',
    },
  },
  kale: {
    headers: {
      main: '#753BBD',
    },
  },
});
