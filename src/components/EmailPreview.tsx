import React, { useState } from 'react';
import './EmailPreview.css';

interface EmailPreviewProps {
  htmlContent: string;
  textContent: string;
  subject: string;
  variables: { [key: string]: any };
  onClose: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  htmlContent,
  textContent,
  subject,
  variables,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'raw'>('html');
  const replaceVariables = (content: string): string => {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      result = result.replace(regex, String(value));
    });
    return result;
  };

  const processedHtml = replaceVariables(htmlContent);
  const processedText = replaceVariables(textContent);
  const processedSubject = replaceVariables(subject);

  return (
    <div className="email-preview-modal">
      <div className="email-preview-content">
        <div className="email-preview-header">
          <h3>📧 Email Preview</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="email-preview-body">
          <div className="email-info">
            <div className="email-field">
              <label>Subject:</label>
              <div className="email-value">{processedSubject}</div>
            </div>
          </div>

                     <div className="email-tabs">
             <div className="tab-header">
               <button 
                 className={`tab-button ${activeTab === 'html' ? 'active' : ''}`}
                 onClick={() => setActiveTab('html')}
               >
                 HTML Preview
               </button>
               <button 
                 className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
                 onClick={() => setActiveTab('text')}
               >
                 Text Preview
               </button>
               <button 
                 className={`tab-button ${activeTab === 'raw' ? 'active' : ''}`}
                 onClick={() => setActiveTab('raw')}
               >
                 Raw HTML
               </button>
             </div>

             <div className="tab-content">
               {activeTab === 'html' && (
                 <div className="tab-pane active" id="html-preview">
                   <div 
                     className="html-preview-content"
                     dangerouslySetInnerHTML={{ __html: processedHtml }}
                   />
                 </div>
               )}

               {activeTab === 'text' && (
                 <div className="tab-pane active" id="text-preview">
                   <div className="text-preview-content">
                     <pre>{processedText}</pre>
                   </div>
                 </div>
               )}

               {activeTab === 'raw' && (
                 <div className="tab-pane active" id="raw-preview">
                   <div className="raw-preview-content">
                     <pre>{processedHtml}</pre>
                   </div>
                 </div>
               )}
             </div>
           </div>

          <div className="email-preview-footer">
            <div className="variables-info">
              <h4>Variables Used:</h4>
              <div className="variables-list">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="variable-item">
                                         <span className="variable-name">{`{{${key}}}`}</span>
                    <span className="variable-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
