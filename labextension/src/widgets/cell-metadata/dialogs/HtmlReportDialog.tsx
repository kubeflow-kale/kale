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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

type HtmlReportValue = 'default' | 'disabled';

interface IHtmlReportDialogProps {
  open: boolean;
  onClose: () => void;
  generateHtmlReport?: boolean;
  onUpdateHtmlReport: (value: boolean | undefined) => void;
}

export const HtmlReportDialog: React.FC<IHtmlReportDialogProps> = ({
  open,
  onClose,
  generateHtmlReport,
  onUpdateHtmlReport,
}) => {
  const [reportValue, setReportValue] =
    React.useState<HtmlReportValue>('default');

  React.useEffect(() => {
    if (open) {
      setReportValue(generateHtmlReport === false ? 'disabled' : 'default');
    }
  }, [open, generateHtmlReport]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as HtmlReportValue;
    setReportValue(val);
    onUpdateHtmlReport(val === 'disabled' ? false : undefined);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>HTML Report Generation</DialogTitle>
      <DialogContent>
        <p style={{ margin: '8px 0 16px 0' }}>
          Control whether this step generates an HTML report artifact. The HTML
          report contains the rendered output of the notebook cells executed in
          this step.
        </p>
        <FormControl component="fieldset">
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};
