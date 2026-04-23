import React from 'react';

function Button({ 
  children, 
  type = 'button', 
  onClick, 
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false 
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full-width' : ''} ${loading ? 'btn-loading' : ''}`}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
