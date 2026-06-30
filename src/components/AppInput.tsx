import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type BaseProps = {
  label: string;
  error?: string;
  helper?: string;
  multiline?: boolean;
};

type AppInputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AppInput = ({ label, error, helper, multiline, className = '', ...props }: AppInputProps) => {
  const id = props.id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase();
  return (
    <label className={`field ${className}`} htmlFor={id}>
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea id={id} className={`input textarea ${error ? 'input-error' : ''}`} {...props} />
      ) : (
        <input id={id} className={`input ${error ? 'input-error' : ''}`} {...props} />
      )}
      {error ? <span className="field-error">{error}</span> : helper ? <span className="field-helper">{helper}</span> : null}
    </label>
  );
};
