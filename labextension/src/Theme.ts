// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--jp-layout-color1)',
          color: 'var(--jp-ui-font-color1)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color2)',
          '&.Mui-focused': {
            color: '#2e82d7',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: 'var(--jp-ui-font-color1)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'var(--jp-input-border-color)',
        },
        root: {
          '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--jp-input-border-color)',
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:before': {
            borderBottomColor: 'var(--jp-input-border-color)',
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: 'var(--jp-input-border-color)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: 'var(--jp-ui-font-color1)',
        },
      },
    },
  },
});
