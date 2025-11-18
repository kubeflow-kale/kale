import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles/createTheme' {
  // eslint-disable-next-line
  interface Theme {
    kale: {
      headers: {
        main: string;
      };
    };
  }
  // allow configuration using `createMuiTheme`
  // eslint-disable-next-line
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
      light: '#9062ca'
    },
    primary: {
      main: '#2e82d7',
      dark: '#205b96',
      light: '#579bdf'
    }
  },
  kale: {
    headers: {
      main: '#753BBD'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--jp-layout-color1)',
          color: 'var(--jp-ui-font-color1)'
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)'
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)'
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)'
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color2)',
          '&.Mui-focused': {
            color: '#2e82d7'
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'var(--jp-input-border-color)'
        },
        root: {
          '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--jp-input-border-color)'
          }
        }
      }
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:before': {
            borderBottomColor: 'var(--jp-input-border-color)'
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: 'var(--jp-input-border-color)'
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: 'var(--jp-ui-font-color1)'
        }
      }
    }
  }
});
