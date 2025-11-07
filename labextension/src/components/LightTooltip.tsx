// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2019–2025 The Kale Contributors.

import React from 'react';
import { styled } from '@mui/material/styles';
import { TooltipProps } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

export const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  ['& .MuiTooltip-tooltip']: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: 'var(--jp-ui-font-size1)'
  }
}));
