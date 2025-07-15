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
import WarningIcon from '@material-ui/icons/Warning';
import InfoIcon from '@material-ui/icons/Info';

import NotebookUtils from '../../lib/NotebookUtils';

export default class DeployUtils {
  static color = {
    // From kubeflow/pipelines repo
    activeBg: '#eaf1fd',
    alert: '#f9ab00', // Google yellow 600
    background: '#fff',
    blue: '#4285f4', // Google blue 500
    disabledBg: '#ddd',
    divider: '#e0e0e0',
    errorBg: '#fbe9e7',
    errorText: '#d50000',
    foreground: '#000',
    graphBg: '#f2f2f2',
    grey: '#5f6368', // Google grey 500
    inactive: '#5f6368',
    lightGrey: '#eee', // Google grey 200
    lowContrast: '#80868b', // Google grey 600
    secondaryText: 'rgba(0, 0, 0, .88)',
    separator: '#e8e8e8',
    strong: '#202124', // Google grey 900
    success: '#34a853',
    successWeak: '#e6f4ea', // Google green 50
    terminated: '#80868b',
    theme: '#1a73e8',
    themeDarker: '#0b59dc',
    warningBg: '#f9f9e1',
    warningText: '#ee8100',
    weak: '#9aa0a6',
    // From Rok repo
    canceled: '#ff992a',
  };

  public static getInfoBadge(title: string, content: any) {
    return (
      content && (
        <a
          onClick={_ => {
            NotebookUtils.showMessage(title, content);
          }}
        >
          <InfoIcon style={{ color: this.color.blue, height: 18, width: 18 }} />
        </a>
      )
    );
  }

  public static getWarningBadge(title: string, content: any) {
    return (
      content && (
        <a
          onClick={_ => {
            NotebookUtils.showMessage(title, content);
          }}
        >
          <WarningIcon
            style={{
              color: this.color.alert,
              height: 18,
              width: 18,
            }}
          />
        </a>
      )
    );
  }
}
