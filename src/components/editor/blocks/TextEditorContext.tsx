import React, { createContext, useContext, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface TextEditorContextType {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
}

const TextEditorContext = createContext<TextEditorContextType>({
  activeEditor: null,
  setActiveEditor: () => {},
});

export const useTextEditor = () => useContext(TextEditorContext);

export const TextEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEditor, setActiveEditorState] = useState<Editor | null>(null);

  const setActiveEditor = useCallback((editor: Editor | null) => {
    setActiveEditorState(editor);
  }, []);

  return (
    <TextEditorContext.Provider value={{ activeEditor, setActiveEditor }}>
      {children}
    </TextEditorContext.Provider>
  );
};
