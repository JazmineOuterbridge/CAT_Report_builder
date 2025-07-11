import * as React from 'react';
import './DatabaseInput.module.scss';

export interface IDatabaseInputProps {
  title: string;
  databases: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  required: boolean;
}

export const DatabaseInput: React.FC<IDatabaseInputProps> = ({
  title,
  databases,
  onChange,
  onAdd,
  onRemove,
  required
}) => {
  return (
    <div className="database-input">
      <div className="input-header">
        <h4>{title}</h4>
        {required && <span className="required-indicator">*</span>}
      </div>
      
      <div className="database-fields">
        {databases.map((database, index) => (
          <div key={index} className="database-field">
            <input
              type="text"
              value={database}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder="Enter database name"
              className="database-input-field"
            />
            {databases.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="remove-button"
                title="Remove database"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      
      <button
        type="button"
        onClick={onAdd}
        className="add-button"
      >
        + Add Another Database
      </button>
    </div>
  );
}; 