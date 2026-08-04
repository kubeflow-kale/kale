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

import * as React from 'react';
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

type HtmlReportValue = 'default' | 'disabled';

interface IReportSectionProps {
  generateHtmlReport?: boolean;
  onUpdateHtmlReport: (value: boolean | undefined) => void;
}

export const ReportSection: React.FC<IReportSectionProps> = ({
  generateHtmlReport,
  onUpdateHtmlReport,
}) => {
  // Derived directly from the prop - no local state/effect needed, so there's
  // nothing to resync and no stale-value flash when this section (re)mounts.
  const reportValue: HtmlReportValue =
    generateHtmlReport === false ? 'disabled' : 'default';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as HtmlReportValue;
    onUpdateHtmlReport(val === 'disabled' ? false : undefined);
  };

  return (
    <>
      <p style={{ margin: '0 0 16px' }}>
        Control whether this step generates an HTML report artifact. The HTML
        report contains the rendered output of the notebook cells executed in
        this step.
      </p>
      <FormControl
        component="fieldset"
        sx={{
          '& .MuiRadio-root:not(.Mui-checked)': {
            color: 'var(--jp-ui-font-color2)',
          },
        }}
      >
        <RadioGroup value={reportValue} onChange={handleChange}>
          <FormControlLabel
            value="default"
            control={<Radio />}
            label="Generate HTML Report (Default)"
          />
          <FormControlLabel
            value="disabled"
            control={<Radio />}
            label="Disable HTML Report"
          />
        </RadioGroup>
      </FormControl>
    </>
  );
};
