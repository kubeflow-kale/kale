/*
 * Copyright 2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { Input } from './Input';
import { Switch } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

interface AdvancedSettingsProps {
  title: string;
  debug: boolean;
  dockerImageValue: string;
  dockerImageDefaultValue: string;
  dockerChange: Function;
  changeDebug: Function;
}

export const AdvancedSettings: React.FunctionComponent<AdvancedSettingsProps> = props => {
  const [collapsed, setCollapsed] = React.useState(true);
  const theme = useTheme();

  return (
    <div className={'' + (!collapsed && 'jp-Collapse-open')}>
      <div
        className="jp-Collapse-header kale-header"
        onClick={_ => setCollapsed(!collapsed)}
        style={{ color: theme.kale.headers.main }}
      >
        {props.title}
      </div>
      <div
        className={
          'input-container lm-Panel jp-Collapse-contents ' +
          (collapsed && 'p-mod-hidden')
        }
      >
        <Input
          label="Docker image"
          updateValue={props.dockerChange}
          value={props.dockerImageValue}
          placeholder={props.dockerImageDefaultValue}
          variant="standard"
        />

        <div className="toolbar" style={{ padding: '12px 4px 0 4px' }}>
          <div className="switch-label">Debug</div>
          <Switch
            checked={props.debug}
            onChange={_ => props.changeDebug()}
            color="primary"
            name="enableKale"
            inputProps={{ 'aria-label': 'primary checkbox' }}
          />
        </div>
      </div>
    </div>
  );
};
