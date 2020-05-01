import * as React from 'react';

export const CellMetadataContext = React.createContext({
  isEditorVisible: false,
  activeCellIndex: -1,
  onEditorVisibilityChange: (isEditorVisible: boolean) => {},
});
