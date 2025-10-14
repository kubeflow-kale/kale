// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2019–2025 The Kale Contributors.

import * as React from 'react';

export const CellMetadataContext = React.createContext({
  isEditorVisible: false,
  activeCellIndex: -1,
  onEditorVisibilityChange: (isEditorVisible: boolean) => {},
});
