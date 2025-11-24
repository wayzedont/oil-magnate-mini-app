import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "relative font-bold uppercase tracking-wider py-3 px-4 rounded transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:active:scale-100 border-b-4";
  
  const variants = {
    primary: "bg-industrial-accent text-industrial-900 border-industrial-accentHover hover:bg-yellow-400",
    secondary: "bg-industrial-700 text-slate-200 border-industrial-800 hover:bg-industrial-600",
    danger: "bg-industrial-danger text-white border-red-700 hover:bg-red-400",
    success: "bg-industrial-success text-white border-green-700 hover:bg-green-400",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};