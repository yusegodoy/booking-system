import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variables?: string[];
  onVariableInsert?: (variable: string) => void;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  variables = [],
  onVariableInsert,
  readOnly = false
}) => {
  const [showVariables, setShowVariables] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Quill modules configuration - Simplified to avoid module conflicts
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  // Quill formats configuration
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image',
    'color', 'background',
    'align', 'clean'
  ];

  const insertVariable = (variable: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        quill.insertText(range.index, `{{${variable}}}`, 'user');
        quill.setSelection(range.index + variable.length + 4);
      } else {
        quill.insertText(quill.getLength(), `{{${variable}}}`, 'user');
      }
    }
    
    if (onVariableInsert) {
      onVariableInsert(variable);
    }
    
    setShowVariables(false);
  };

  const handleChange = (content: string, delta: any, source: any, editor: any) => {
    onChange(content);
  };

  return (
    <div className="rich-text-editor-container">
      <div className="editor-toolbar">
        <button
          className="variables-button"
          onClick={() => setShowVariables(!showVariables)}
          title="Insert Variables"
        >
          📝 Variables
        </button>
      </div>

      {showVariables && variables.length > 0 && (
        <div className="variables-panel">
          <div className="variables-header">
            <h4>Available Variables</h4>
            <button 
              className="close-variables"
              onClick={() => setShowVariables(false)}
            >
              ✕
            </button>
          </div>
          <div className="variables-grid">
            {variables.map((variable) => (
              <button
                key={variable}
                className="variable-item"
                onClick={() => insertVariable(variable)}
                title={`Insert {{${variable}}}`}
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="quill-editor-wrapper">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>

      <div className="editor-footer">
        <div className="word-count">
          Words: {value.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}
        </div>
        <div className="character-count">
          Characters: {value.replace(/<[^>]*>/g, '').length}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
