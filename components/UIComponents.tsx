import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', loading, className = '', ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-sm transition-all duration-100 font-medium text-sm tracking-tight disabled:opacity-50 disabled:cursor-not-allowed uppercase";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-black border border-primary",
    secondary: "bg-platinum text-primary hover:bg-steel/10 border border-transparent",
    outline: "bg-transparent border border-border text-primary hover:bg-platinum",
    danger: "bg-error text-white hover:opacity-90 border border-error",
    ghost: "bg-transparent text-primary hover:bg-platinum"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2",
    lg: "px-6 py-2.5",
    icon: "p-2"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
      {!loading && children}
    </button>
  );
};

// --- Card ---
export const Card: React.FC<{ children: ReactNode; className?: string; noPadding?: boolean }> = ({ 
  children, className = '', noPadding = false 
}) => (
  <div className={`bg-white border border-border rounded-sm industrial-shadow ${className}`}>
    <div className={noPadding ? '' : 'p-5'}>
      {children}
    </div>
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ children: ReactNode; variant?: 'success' | 'warning' | 'error' | 'neutral' }> = ({ 
  children, variant = 'neutral' 
}) => {
  const styles = {
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    error: "text-error bg-error/10 border-error/20",
    neutral: "text-gray-600 bg-gray-100 border-gray-200"
  };
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded border ${styles[variant]}`}>
      {children}
    </div>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-[11px] font-bold text-steel uppercase tracking-widest">{label}</label>}
    <input 
      className={`border border-border rounded-sm px-3 py-2 text-sm bg-white outline-none transition-all placeholder:text-gray-300 ${error ? 'border-error' : ''} ${className}`}
      {...props}
    />
    {error && <span className="text-[10px] text-error font-medium uppercase">{error}</span>}
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-[11px] font-bold text-steel uppercase tracking-widest">{label}</label>}
    <select 
      className={`border border-border rounded-sm px-3 py-2 text-sm bg-white outline-none transition-all cursor-pointer ${className}`}
      {...props}
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// --- Table ---
export const Table: React.FC<{ headers: string[]; children: ReactNode }> = ({ headers, children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-y border-border bg-platinum/50">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 font-bold text-steel uppercase text-[10px] tracking-widest">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {children}
      </tbody>
    </table>
  </div>
);

// --- Dialog ---
export const Dialog: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: ReactNode;
  footer?: ReactNode;
}> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white border border-border rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-platinum/30">
          <h2 className="text-xs font-bold uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="text-steel hover:text-primary text-xl leading-none">&times;</button>
        </div>
        <div className="p-8 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-platinum/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Switch (Improved) ---
export const Switch: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label?: string }> = ({ 
  checked, 
  onChange,
  label 
}) => (
  <button 
    type="button"  // ← Add this to prevent form submission
    onClick={(e) => {
      e.preventDefault();  // ← Prevent default behavior
      onChange(!checked);
    }}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
      ${checked 
        ? 'bg-success focus:ring-success' 
        : 'bg-gray-300 focus:ring-gray-400'
      }
    `}
    role="switch"
    aria-checked={checked}
    aria-label={label}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
        ${checked ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
);