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

// import * as React from 'react';
// import { Input } from './Input';
// import { Switch } from '@mui/material';
// import { useTheme } from '@mui/material/styles';
// import { theme } from '../Theme';

// interface AdvancedSettingsProps {
//   title: string;
//   debug: boolean;
//   dockerImageValue: string;
//   dockerImageDefaultValue: string;
//   dockerChange: Function;
//   changeDebug: Function;
//   volsPanel: any;
// }

// export const AdvancedSettings: React.FunctionComponent<AdvancedSettingsProps> = props => {
//   const [collapsed, setCollapsed] = React.useState(true);
//   const theme = useTheme();

//   return (
//     <div className={'' + (!collapsed && 'jp-Collapse-open')}>
//       <div
//         className="jp-Collapse-header kale-header"
//         onClick={_ => setCollapsed(!collapsed)}
//         style={{ color: theme.kale.headers.main }}
//       >
//         {props.title}
//       </div>
//       <div
//         className={
//           'input-container lm-Panel jp-Collapse-contents ' +
//           (collapsed && 'p-mod-hidden')
//         }
//       >
//         <Input
//           label="Docker image"
//           updateValue={props.dockerChange}
//           value={props.dockerImageValue}
//           placeholder={props.dockerImageDefaultValue}
//           variant="standard"
//         />

//         <div className="toolbar" style={{ padding: '12px 4px 0 4px' }}>
//           <div className="switch-label">Debug</div>
//           <Switch
//             checked={props.debug}
//             onChange={_ => props.changeDebug()}
//             color="primary"
//             name="enableKale"
//             inputProps={{ 'aria-label': 'primary checkbox' }}
//           />
//         </div>

//         <div className="kale-component" key="kale-component-volumes">
//           <div className="kale-header-switch">
//             <p
//               className="kale-header"
//               style={{ color: theme.kale.headers.main }}
//             >
//               Volumes
//             </p>
//           </div>
//           {props.volsPanel}
//         </div>
//       </div>
//     </div>
//   );
// };

import * as React from 'react';
import { Input } from './Input';
import { Switch } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

// Styled components for better theming
const CollapseContainer = styled('div')<{ collapsed: boolean }>(
  ({ collapsed }) => ({
    '&.jp-Collapse-open': {
      // Add any specific styles for open state
    }
  })
);

const CollapseHeader = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  padding: '8px 12px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const CollapseContents = styled('div')<{ collapsed: boolean }>(
  ({ collapsed }) => ({
    padding: '16px',
    display: collapsed ? 'none' : 'block'
  })
);

const ToolbarContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 4px 0 4px'
});

const SwitchLabel = styled('div')(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.text.primary
}));

const KaleComponent = styled('div')({
  marginTop: '16px'
});

const KaleHeaderSwitch = styled('div')({
  marginBottom: '12px'
});

const KaleHeader = styled('p')(({ theme }) => ({
  margin: 0,
  fontWeight: 'bold',
  fontSize: theme.typography.subtitle2.fontSize
}));

interface IAdvancedSettingsProps {
  title: string;
  debug: boolean;
  dockerImageValue: string;
  dockerImageDefaultValue: string;
  dockerChange: (value: string, index?: number) => void;
  changeDebug: () => void;
  volsPanel: React.ReactNode;
}

export const AdvancedSettings: React.FunctionComponent<
  IAdvancedSettingsProps
> = props => {
  const [collapsed, setCollapsed] = React.useState(true);
  const theme = useTheme();

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleDockerChange = (value: string, index?: number) => {
    props.dockerChange(value, index);
  };

  const handleDebugChange = () => {
    props.changeDebug();
  };

  return (
    <CollapseContainer
      collapsed={collapsed}
      className={!collapsed ? 'jp-Collapse-open' : ''}
    >
      <CollapseHeader
        className="jp-Collapse-header kale-header"
        onClick={handleToggleCollapse}
        sx={{
          color:
            (theme as any).kale?.headers?.main || 'var(--jp-ui-font-color1)'
        }}
      >
        {props.title}
      </CollapseHeader>

      <CollapseContents
        collapsed={collapsed}
        className={`input-container lm-Panel jp-Collapse-contents ${collapsed ? 'p-mod-hidden' : ''}`}
      >
        <Input
          label="Docker image"
          updateValue={handleDockerChange}
          value={props.dockerImageValue}
          placeholder={props.dockerImageDefaultValue}
          variant="standard"
          inputIndex={0}
        />

        <ToolbarContainer className="toolbar">
          <SwitchLabel className="switch-label">Debug</SwitchLabel>
          <Switch
            checked={props.debug}
            onChange={handleDebugChange}
            color="primary"
            name="enableKale"
            inputProps={{ 'aria-label': 'Enable debug mode' }}
          />
        </ToolbarContainer>

        <KaleComponent className="kale-component" key="kale-component-volumes">
          <KaleHeaderSwitch className="kale-header-switch">
            <KaleHeader
              className="kale-header"
              sx={{
                color:
                  (theme as any).kale?.headers?.main ||
                  'var(--jp-ui-font-color1)'
              }}
            >
              Volumes
            </KaleHeader>
          </KaleHeaderSwitch>
          {props.volsPanel}
        </KaleComponent>
      </CollapseContents>
    </CollapseContainer>
  );
};
