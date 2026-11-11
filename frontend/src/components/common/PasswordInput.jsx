import { useState } from 'react';

export default function PasswordInput({
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  autoComplete = 'current-password',
  minLength,
  maxLength,
  placeholder,
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="input-group">
      <input
        id={id}
        type={visivel ? 'text' : 'password'}
        className="form-control"
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-required={required ? 'true' : undefined}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => setVisivel(!visivel)}
        disabled={disabled}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
        tabIndex={-1}
      >
        <i className={`bi bi-eye${visivel ? '-slash' : ''}`} aria-hidden="true"></i>
      </button>
    </div>
  );
}