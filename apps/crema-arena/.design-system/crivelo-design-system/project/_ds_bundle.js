/* @ds-bundle: {"format":3,"namespace":"CremaArenaDesignSystem_019e30","components":[{"name":"Badge","sourcePath":"app/components/Badge.tsx"},{"name":"Button","sourcePath":"app/components/Button.tsx"},{"name":"Card","sourcePath":"app/components/Card.tsx"},{"name":"ConfirmationModal","sourcePath":"app/components/ConfirmationModal.tsx"},{"name":"EmptyState","sourcePath":"app/components/EmptyState.tsx"},{"name":"Input","sourcePath":"app/components/Input.tsx"},{"name":"LoadingSpinner","sourcePath":"app/components/LoadingSpinner.tsx"},{"name":"Modal","sourcePath":"app/components/Modal.tsx"},{"name":"PageHeader","sourcePath":"app/components/PageHeader.tsx"},{"name":"Sidebar","sourcePath":"app/components/Sidebar.tsx"},{"name":"SkeletonLoader","sourcePath":"app/components/SkeletonLoader.tsx"},{"name":"ToastProvider","sourcePath":"app/components/Toast.tsx"},{"name":"Wordmark","sourcePath":"app/components/Wordmark.tsx"},{"name":"X","sourcePath":"app/components/icons.tsx"},{"name":"Menu","sourcePath":"app/components/icons.tsx"},{"name":"CheckCircle2","sourcePath":"app/components/icons.tsx"},{"name":"AlertCircle","sourcePath":"app/components/icons.tsx"},{"name":"RootLayout","sourcePath":"app/layout.tsx"}],"sourceHashes":{"app/components/Badge.tsx":"5d9d2335532d","app/components/Button.tsx":"f50f058d937d","app/components/Card.tsx":"b93b6a3866e6","app/components/ConfirmationModal.tsx":"f9ace3db26c7","app/components/EmptyState.tsx":"23a7bfbc49b6","app/components/Input.tsx":"0012f3751d45","app/components/LoadingSpinner.tsx":"a51a9a549753","app/components/Modal.tsx":"cd2cfff2a6a3","app/components/PageHeader.tsx":"e7f1695e4cb4","app/components/Sidebar.tsx":"35fa64fe0c8e","app/components/SkeletonLoader.tsx":"14d9cda3c66f","app/components/Toast.tsx":"0c550c9ad4ad","app/components/Wordmark.tsx":"9b6b44cf5aa9","app/components/icons.tsx":"6ab41fce1034","app/layout.tsx":"8eb2e9a90006","tailwind.config.ts":"961f25b836ff"},"inlinedExternals":[],"unexposedExports":[{"name":"config","sourcePath":"tailwind.config.ts"},{"name":"metadata","sourcePath":"app/layout.tsx"},{"name":"useToast","sourcePath":"app/components/Toast.tsx"}]} */

(() => {

const __ds_ns = (window.CremaArenaDesignSystem_019e30 = window.CremaArenaDesignSystem_019e30 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app/components/Badge.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  HTMLAttributes,
  forwardRef
} = React;
const Badge = forwardRef(({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[var(--radius-full)] whitespace-nowrap';
  const variantStyles = {
    default: 'bg-[var(--bg-3)] text-[var(--fg-2)]',
    success: 'bg-[var(--success-soft)] text-[var(--success)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)]'
  };
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    className: combinedClassName
  }, props), children);
});
Badge.displayName = 'Badge';
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Badge.tsx", error: String((e && e.message) || e) }); }

// app/components/Button.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  ButtonHTMLAttributes,
  forwardRef
} = React;
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';
  const variantStyles = {
    primary: 'bg-[var(--brand)] text-[var(--fg-inverse)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-press)] shadow-sm hover:shadow-[var(--shadow-1)]',
    secondary: 'bg-[var(--bg-2)] text-[var(--fg)] hover:bg-[var(--bg-3)] active:bg-[var(--crema-300)] border border-[var(--border-strong)] hover:border-[var(--brand)]',
    danger: 'bg-[var(--danger)] text-white hover:bg-[#9E2F24] active:bg-[#842619] shadow-sm hover:shadow-[var(--shadow-1)]',
    ghost: 'text-[var(--fg-2)] hover:bg-[var(--bg-2)] active:bg-[var(--bg-3)] hover:text-[var(--fg)]'
  };
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 rounded-[var(--radius-xs)] gap-1.5 min-h-[36px]',
    md: 'text-base px-4 py-2 rounded-[var(--radius-sm)] gap-2 min-h-[44px]',
    lg: 'text-lg px-6 py-3 rounded-[var(--radius-md)] gap-2.5 min-h-[52px]'
  };
  const widthStyle = fullWidth ? 'w-full' : '';
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;
  return /*#__PURE__*/React.createElement("button", _extends({
    ref: ref,
    className: combinedClassName,
    disabled: disabled,
    style: {
      transitionDuration: 'var(--dur-base)',
      transitionTimingFunction: 'var(--ease-standard)'
    }
  }, props), children);
});
Button.displayName = 'Button';
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Button.tsx", error: String((e && e.message) || e) }); }

// app/components/Card.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  HTMLAttributes,
  forwardRef
} = React;
const Card = forwardRef(({
  padding = 'md',
  shadow = 'sm',
  border = true,
  className = '',
  children,
  ...props
}, ref) => {
  const baseStyles = 'bg-[var(--surface-raised)] rounded-[var(--radius-md)]';
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };
  const shadowStyles = {
    none: '',
    sm: 'shadow-[var(--shadow-1)]',
    md: 'shadow-[var(--shadow-2)]'
  };
  const borderStyle = border ? 'border border-[var(--border)]' : '';
  const combinedClassName = `${baseStyles} ${paddingStyles[padding]} ${shadowStyles[shadow]} ${borderStyle} ${className}`;
  return /*#__PURE__*/React.createElement("div", _extends({
    ref: ref,
    className: combinedClassName
  }, props), children);
});
Card.displayName = 'Card';
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Card.tsx", error: String((e && e.message) || e) }); }

// app/components/Input.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  InputHTMLAttributes,
  forwardRef
} = React;
const Input = forwardRef(({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;
  const baseInputStyles = 'w-full px-3 py-2 rounded-[var(--radius-sm)] border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--surface)] text-[var(--fg)]';
  const errorStyles = hasError ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border-strong)] focus:border-[var(--brand)]';
  const inputClassName = `${baseInputStyles} ${errorStyles} ${className}`;
  return /*#__PURE__*/React.createElement("div", {
    className: fullWidth ? 'w-full' : ''
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    className: "block text-sm font-medium text-[var(--fg-2)] mb-1.5"
  }, label, props.required && /*#__PURE__*/React.createElement("span", {
    className: "text-[var(--danger)] ml-1"
  }, "*")), /*#__PURE__*/React.createElement("input", _extends({
    ref: ref,
    id: inputId,
    className: inputClassName,
    style: {
      transitionDuration: 'var(--dur-base)',
      transitionTimingFunction: 'var(--ease-standard)'
    },
    "aria-invalid": hasError,
    "aria-describedby": error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
  }, props)), error && /*#__PURE__*/React.createElement("p", {
    id: `${inputId}-error`,
    className: "mt-1.5 text-sm text-[var(--danger)]"
  }, error), helperText && !error && /*#__PURE__*/React.createElement("p", {
    id: `${inputId}-helper`,
    className: "mt-1.5 text-sm text-[var(--fg-3)]"
  }, helperText));
});
Input.displayName = 'Input';
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Input.tsx", error: String((e && e.message) || e) }); }

// app/components/LoadingSpinner.tsx
try { (() => {
/**
 * Concentric rings loader. Three ink-toned rings rotating at 1.4s / 2.1s
 * (reversed) / 3.2s. Calm and neutral — the house carries no accent color.
 */
function LoadingSpinner({
  size = 'md',
  className = '',
  variant = 'dark'
}) {
  const sizes = {
    sm: 24,
    md: 40,
    lg: 64
  };
  const px = sizes[size];
  const onDark = variant === 'light';
  const outer = onDark ? 'var(--crema-50)' : 'var(--espresso-900)';
  const mid = onDark ? 'var(--crema-300)' : 'var(--espresso-500)';
  const inner = onDark ? 'var(--crema-100)' : 'var(--espresso-700)';
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-label": "Carregando",
    className: `inline-block relative ${className}`,
    style: {
      width: px,
      height: px
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "absolute inset-0 rounded-full border-2 border-transparent",
    style: {
      borderTopColor: outer,
      animation: 'rings-spin 1.4s linear infinite'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute rounded-full border-2 border-transparent",
    style: {
      inset: Math.max(2, Math.round(px * 0.16)),
      borderTopColor: mid,
      animation: 'rings-spin-reverse 2.1s linear infinite'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute rounded-full border-2 border-transparent",
    style: {
      inset: Math.max(4, Math.round(px * 0.32)),
      borderTopColor: inner,
      animation: 'rings-spin 3.2s linear infinite'
    }
  }));
}
Object.assign(__ds_scope, { LoadingSpinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/LoadingSpinner.tsx", error: String((e && e.message) || e) }); }

// app/components/PageHeader.tsx
try { (() => {
const {
  ReactNode
} = React;
function PageHeader({
  title,
  description,
  actions,
  breadcrumbs
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-6 md:mb-8"
  }, breadcrumbs && breadcrumbs.length > 0 && /*#__PURE__*/React.createElement("nav", {
    className: "mb-3",
    "aria-label": "Breadcrumb"
  }, /*#__PURE__*/React.createElement("ol", {
    className: "flex items-center gap-2 text-sm text-[var(--fg-3)]"
  }, breadcrumbs.map((crumb, index) => /*#__PURE__*/React.createElement("li", {
    key: index,
    className: "flex items-center gap-2"
  }, index > 0 && /*#__PURE__*/React.createElement("span", null, "/"), crumb.href ? /*#__PURE__*/React.createElement("a", {
    href: crumb.href,
    className: "hover:text-[var(--brand)] transition-colors",
    style: {
      transitionDuration: 'var(--dur-base)'
    }
  }, crumb.label) : /*#__PURE__*/React.createElement("span", {
    className: "text-[var(--fg-2)] font-medium"
  }, crumb.label))))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-3xl md:text-4xl font-display font-bold text-[var(--fg)] mb-2"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "text-base md:text-lg text-[var(--fg-2)] max-w-2xl"
  }, description)), actions && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 md:gap-3"
  }, actions)));
}
Object.assign(__ds_scope, { PageHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/PageHeader.tsx", error: String((e && e.message) || e) }); }

// app/components/SkeletonLoader.tsx
try { (() => {
function SkeletonLoader({
  type = 'text',
  count = 1,
  className = ''
}) {
  const baseClasses = 'animate-pulse bg-[var(--bg-3)] rounded-[var(--radius-sm)]';
  const renderSkeleton = () => {
    switch (type) {
      case 'avatar':
        return /*#__PURE__*/React.createElement("div", {
          className: `${baseClasses} w-12 h-12 rounded-full`
        });
      case 'card':
        return /*#__PURE__*/React.createElement("div", {
          className: `${baseClasses} p-6 space-y-4`
        }, /*#__PURE__*/React.createElement("div", {
          className: "h-6 bg-[var(--bg-3)] rounded w-3/4"
        }), /*#__PURE__*/React.createElement("div", {
          className: "space-y-2"
        }, /*#__PURE__*/React.createElement("div", {
          className: "h-4 bg-[var(--bg-3)] rounded"
        }), /*#__PURE__*/React.createElement("div", {
          className: "h-4 bg-[var(--bg-3)] rounded w-5/6"
        })));
      case 'table':
        return /*#__PURE__*/React.createElement("div", {
          className: "space-y-3"
        }, [...Array(5)].map((_, i) => /*#__PURE__*/React.createElement("div", {
          key: i,
          className: `${baseClasses} h-12 w-full`
        })));
      case 'text':
      default:
        return /*#__PURE__*/React.createElement("div", {
          className: `${baseClasses} h-4 w-full`
        });
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    role: "status",
    "aria-label": "Carregando conte\xFAdo"
  }, [...Array(count)].map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: count > 1 ? 'mb-4' : ''
  }, renderSkeleton())), /*#__PURE__*/React.createElement("span", {
    className: "sr-only"
  }, "Carregando..."));
}
Object.assign(__ds_scope, { SkeletonLoader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/SkeletonLoader.tsx", error: String((e && e.message) || e) }); }

// app/components/Wordmark.tsx
try { (() => {
/**
 * CrivelloMark — the dot-matrix sieve monogram. A 5×5 screen of apertures;
 * the filled dots sort themselves into a "C". Curation made literal: the house
 * keeps what matters and screens out the rest. Inherits `currentColor`.
 */
function CrivelloMark({
  px
}) {
  // 5×5 grid. 1 = kept (solid ink), 0 = screened (faint aperture).
  const grid = [[1, 1, 1, 1, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 1, 1, 1, 0]];
  const coords = [8, 20, 32, 44, 56];
  return /*#__PURE__*/React.createElement("svg", {
    width: px,
    height: px,
    viewBox: "0 0 64 64",
    fill: "none",
    "aria-hidden": "true",
    className: "flex-shrink-0"
  }, grid.flatMap((row, r) => row.map((on, c) => on ? /*#__PURE__*/React.createElement("circle", {
    key: `${r}-${c}`,
    cx: coords[c],
    cy: coords[r],
    r: 4,
    fill: "currentColor"
  }) : /*#__PURE__*/React.createElement("circle", {
    key: `${r}-${c}`,
    cx: coords[c],
    cy: coords[r],
    r: 2,
    fill: "currentColor",
    opacity: 0.16
  }))));
}

/**
 * Crivelo wordmark. "Crivelo" set in Bricolage Grotesque — the calm, neutral
 * house. Optionally preceded by the sieve monogram, and optionally rendered as
 * the "[product] by Crivelo" endorsement lockup.
 */
function Wordmark({
  size = 'md',
  showMonogram = true,
  className = '',
  variant = 'dark',
  product
}) {
  const sizes = {
    sm: {
      mono: 22,
      word: 'text-lg',
      product: 'text-lg',
      by: 'text-[11px]'
    },
    md: {
      mono: 30,
      word: 'text-2xl',
      product: 'text-2xl',
      by: 'text-xs'
    },
    lg: {
      mono: 42,
      word: 'text-4xl',
      product: 'text-4xl',
      by: 'text-sm'
    }
  };
  const s = sizes[size];
  const ink = variant === 'light' ? 'var(--crema-50)' : 'var(--fg)';
  const muted = variant === 'light' ? 'var(--crema-300)' : 'var(--fg-3)';
  return /*#__PURE__*/React.createElement("div", {
    className: `inline-flex items-center gap-3 ${className}`,
    style: {
      color: ink
    }
  }, showMonogram && /*#__PURE__*/React.createElement(CrivelloMark, {
    px: s.mono
  }), product ? /*#__PURE__*/React.createElement("span", {
    className: "inline-flex flex-col leading-none gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: `font-display font-bold ${s.product}`,
    style: {
      letterSpacing: '-0.02em'
    }
  }, product), /*#__PURE__*/React.createElement("span", {
    className: `font-body ${s.by}`,
    style: {
      color: muted,
      letterSpacing: '0.01em'
    }
  }, "by", ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: ink,
      fontWeight: 600
    }
  }, "Crivelo"))) : /*#__PURE__*/React.createElement("span", {
    className: `font-display font-bold leading-none ${s.word}`,
    style: {
      letterSpacing: '-0.02em'
    }
  }, "Crivelo"));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Wordmark.tsx", error: String((e && e.message) || e) }); }

// app/components/icons.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tiny inline icon set — replaces lucide-react so the design-system bundle has
 * no unresolved npm imports. Outline only, 1.75 stroke, 24×24 grid, currentColor
 * — matches the iconography rules in README.md. Add glyphs here as needed.
 */

function Svg({
  size = 24,
  strokeWidth = 1.75,
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, props), children);
}
function X({
  strokeWidth,
  ...props
}) {
  return /*#__PURE__*/React.createElement(Svg, _extends({
    strokeWidth: strokeWidth
  }, props), /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }));
}
function Menu({
  strokeWidth,
  ...props
}) {
  return /*#__PURE__*/React.createElement(Svg, _extends({
    strokeWidth: strokeWidth
  }, props), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "6",
    x2: "21",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "12",
    x2: "21",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "18",
    x2: "21",
    y2: "18"
  }));
}
function CheckCircle2({
  strokeWidth,
  ...props
}) {
  return /*#__PURE__*/React.createElement(Svg, _extends({
    strokeWidth: strokeWidth
  }, props), /*#__PURE__*/React.createElement("path", {
    d: "M22 11.08V12a10 10 0 1 1-5.93-9.14"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "22 4 12 14.01 9 11.01"
  }));
}
function AlertCircle({
  strokeWidth,
  ...props
}) {
  return /*#__PURE__*/React.createElement(Svg, _extends({
    strokeWidth: strokeWidth
  }, props), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  }));
}
Object.assign(__ds_scope, { X, Menu, CheckCircle2, AlertCircle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/icons.tsx", error: String((e && e.message) || e) }); }

// app/components/EmptyState.tsx
try { (() => {
function EmptyState({
  icon: Icon,
  title,
  description,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center justify-center py-12 px-4 text-center bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]",
    role: "status",
    "aria-live": "polite"
  }, Icon && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-4 rounded-full bg-[var(--bg-2)]",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 48,
    className: "text-[var(--fg-3)]"
  })), /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-display font-semibold text-[var(--fg-2)] mb-2"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "text-[var(--fg-3)] mb-6 max-w-md"
  }, description), action && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    onClick: action.onClick,
    "aria-label": action.label
  }, action.label));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/EmptyState.tsx", error: String((e && e.message) || e) }); }

// app/components/Modal.tsx
try { (() => {
'use client';

const {
  ReactNode,
  useEffect
} = React;
function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}) {
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm",
    onClick: onClose,
    "aria-labelledby": "modal-title",
    "aria-modal": "true",
    role: "dialog",
    style: {
      backgroundColor: 'rgba(31,20,16,0.55)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `relative bg-[var(--surface-raised)] rounded-[var(--radius-lg)] shadow-[var(--shadow-2)] w-full ${sizeStyles[size]} max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`,
    onClick: e => e.stopPropagation(),
    style: {
      transitionTimingFunction: 'var(--ease-overshoot)',
      border: '1.5px solid var(--espresso-900)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between p-6 border-b border-[var(--border)]"
  }, /*#__PURE__*/React.createElement("h2", {
    id: "modal-title",
    className: "text-xl font-display font-bold text-[var(--fg)]"
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "p-1 rounded-[var(--radius-xs)] text-[var(--fg-3)] hover:text-[var(--fg)] hover:bg-[var(--bg-2)] transition-colors",
    "aria-label": "Close modal",
    style: {
      transitionDuration: 'var(--dur-base)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.X, {
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-6"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]"
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Modal.tsx", error: String((e && e.message) || e) }); }

// app/components/ConfirmationModal.tsx
try { (() => {
'use client';

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  isLoading = false
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Modal, {
    isOpen: isOpen,
    onClose: onClose,
    title: title,
    size: "sm",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "ghost",
      onClick: onClose,
      disabled: isLoading
    }, cancelText), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: isDanger ? 'danger' : 'primary',
      onClick: onConfirm,
      disabled: isLoading
    }, isLoading ? 'Processando...' : confirmText))
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[var(--fg-2)]"
  }, message));
}
Object.assign(__ds_scope, { ConfirmationModal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/ConfirmationModal.tsx", error: String((e && e.message) || e) }); }

// app/components/Sidebar.tsx
try { (() => {
'use client';

const {
  useState
} = React;
/**
 * Crivelo neutral app shell. Espresso surface, crema ink. The active item is
 * marked with ink-on-cream — never an accent color, so child products can layer
 * their own accent on top via `--brand`.
 */
function Sidebar({
  navItems,
  activeHref,
  product,
  caption = 'Painel',
  user,
  onSignOut,
  signOutLabel = 'Sair'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = href => activeHref === href || href !== '/' && activeHref?.startsWith(href);
  const SidebarContent = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "p-6 border-b border-[var(--espresso-700)]"
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: "md",
    variant: "light",
    product: product
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[var(--crema-300)] font-mono uppercase tracking-wider mt-2"
  }, caption)), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 px-3 py-4 space-y-1"
  }, navItems.map(item => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return /*#__PURE__*/React.createElement("a", {
      key: item.href,
      href: item.href,
      onClick: () => setIsOpen(false),
      className: `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all min-h-[44px] touch-manipulation ${active ? 'bg-[var(--crema-50)] text-[var(--espresso-900)]' : 'text-[var(--crema-100)] hover:bg-[var(--espresso-700)] hover:text-[var(--crema-50)]'}`,
      style: {
        transitionDuration: 'var(--dur-base)',
        transitionTimingFunction: 'var(--ease-standard)'
      },
      "aria-current": active ? 'page' : undefined
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 18,
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("span", null, item.label));
  })), (user || onSignOut) && /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-t border-[var(--espresso-700)]"
  }, user && /*#__PURE__*/React.createElement("div", {
    className: "mb-3 px-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium text-[var(--crema-50)] truncate"
  }, user.name || '—'), user.email && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[var(--crema-200)] truncate"
  }, user.email)), onSignOut && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    size: "sm",
    fullWidth: true,
    onClick: onSignOut,
    className: "!text-[var(--crema-100)] hover:!bg-[var(--espresso-700)] hover:!text-[var(--crema-50)]"
  }, /*#__PURE__*/React.createElement("span", null, signOutLabel))));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsOpen(!isOpen),
    className: "fixed top-4 left-4 z-50 md:hidden p-3 rounded-[var(--radius-sm)] bg-[var(--espresso-900)] text-[var(--crema-50)] shadow-[var(--shadow-2)] touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center",
    "aria-label": isOpen ? 'Fechar menu' : 'Abrir menu',
    "aria-expanded": isOpen
  }, isOpen ? /*#__PURE__*/React.createElement(__ds_scope.X, {
    size: 24,
    "aria-hidden": "true"
  }) : /*#__PURE__*/React.createElement(__ds_scope.Menu, {
    size: 24,
    "aria-hidden": "true"
  })), isOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-[var(--espresso-900)]/60 backdrop-blur-sm z-40 md:hidden",
    onClick: () => setIsOpen(false),
    role: "button",
    tabIndex: 0,
    "aria-label": "Fechar menu",
    onKeyDown: e => {
      if (e.key === 'Escape') setIsOpen(false);
    }
  }), /*#__PURE__*/React.createElement("aside", {
    className: "hidden md:flex md:flex-col md:w-64 bg-[var(--espresso-900)] min-h-screen",
    role: "navigation",
    "aria-label": "Menu principal"
  }, /*#__PURE__*/React.createElement(SidebarContent, null)), /*#__PURE__*/React.createElement("aside", {
    className: `fixed top-0 left-0 z-40 w-64 h-screen bg-[var(--espresso-900)] transform transition-transform md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`,
    style: {
      transitionDuration: 'var(--dur-stage)',
      transitionTimingFunction: 'var(--ease-standard)'
    },
    role: "navigation",
    "aria-label": "Menu principal"
  }, /*#__PURE__*/React.createElement(SidebarContent, null)));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Sidebar.tsx", error: String((e && e.message) || e) }); }

// app/components/Toast.tsx
try { (() => {
'use client';

const {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} = React;
const {
  createPortal
} = ReactDOM;
const ToastContext = createContext(null);
const DEFAULT_DURATION_MS = 3000;
function ToastProvider({
  children
}) {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);
  useEffect(() => {
    setMounted(true);
  }, []);
  const dismiss = useCallback(id => {
    setToasts(current => current.filter(t => t.id !== id));
  }, []);
  const showToast = useCallback((message, variant = 'success') => {
    const id = ++idRef.current;
    setToasts(current => [...current, {
      id,
      message,
      variant
    }]);
    setTimeout(() => dismiss(id), DEFAULT_DURATION_MS);
  }, [dismiss]);
  const value = useMemo(() => ({
    showToast
  }), [showToast]);
  return /*#__PURE__*/React.createElement(ToastContext.Provider, {
    value: value
  }, children, mounted && createPortal(/*#__PURE__*/React.createElement("div", {
    role: "region",
    "aria-label": "Notifica\xE7\xF5es",
    className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none"
  }, toasts.map(toast => /*#__PURE__*/React.createElement(ToastView, {
    key: toast.id,
    toast: toast,
    onDismiss: dismiss
  }))), document.body));
}
function ToastView({
  toast,
  onDismiss
}) {
  const styles = toast.variant === 'error' ? 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]' : toast.variant === 'info' ? 'bg-[var(--brand-soft)] text-[var(--fg)] border-[var(--border-emphasis)]' : 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]';
  const Icon = toast.variant === 'error' ? __ds_scope.AlertCircle : __ds_scope.CheckCircle2;
  return /*#__PURE__*/React.createElement("div", {
    role: toast.variant === 'error' ? 'alert' : 'status',
    "aria-live": toast.variant === 'error' ? 'assertive' : 'polite',
    className: `toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-2)] border min-w-[280px] max-w-[420px] ${styles}`
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 20,
    strokeWidth: 1.75,
    className: "flex-shrink-0",
    "aria-hidden": true
  }), /*#__PURE__*/React.createElement("p", {
    className: "flex-1 text-sm font-medium"
  }, toast.message), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onDismiss(toast.id),
    "aria-label": "Fechar notifica\xE7\xE3o",
    className: "flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
  }, /*#__PURE__*/React.createElement(__ds_scope.X, {
    size: 16,
    strokeWidth: 1.75,
    "aria-hidden": true
  })));
}
function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}
Object.assign(__ds_scope, { ToastProvider, useToast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/components/Toast.tsx", error: String((e && e.message) || e) }); }

// app/layout.tsx
try { (() => {
const metadata = {
  title: "Crivelo",
  description: "Para quem vive café."
};

// Fonts are loaded via @font-face in fonts.css (imported through styles.css /
// colors_and_type.css), so no next/font wiring is needed here. The --font-*
// tokens in globals.css resolve straight to those families.
function RootLayout({
  children
}) {
  return /*#__PURE__*/React.createElement("html", {
    lang: "pt-BR"
  }, /*#__PURE__*/React.createElement("body", null, /*#__PURE__*/React.createElement(__ds_scope.ToastProvider, null, children)));
}
Object.assign(__ds_scope, { metadata, RootLayout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/layout.tsx", error: String((e && e.message) || e) }); }

// tailwind.config.ts
try { (() => {
const config = {
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        espresso: {
          950: "var(--espresso-950)",
          900: "var(--espresso-900)",
          800: "var(--espresso-800)",
          700: "var(--espresso-700)",
          500: "var(--espresso-500)"
        },
        crema: {
          50: "var(--crema-50)",
          100: "var(--crema-100)",
          200: "var(--crema-200)",
          300: "var(--crema-300)",
          400: "var(--crema-400)"
        },
        sage: {
          100: "var(--sage-100)",
          500: "var(--sage-500)"
        },
        clay: {
          100: "var(--clay-100)",
          500: "var(--clay-500)"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)"
      },
      boxShadow: {
        "1": "var(--shadow-1)",
        "2": "var(--shadow-2)"
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        stage: "var(--dur-stage)"
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        overshoot: "var(--ease-overshoot)"
      }
    }
  },
  plugins: []
};
Object.assign(__ds_scope, { config });
})(); } catch (e) { __ds_ns.__errors.push({ path: "tailwind.config.ts", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ConfirmationModal = __ds_scope.ConfirmationModal;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.LoadingSpinner = __ds_scope.LoadingSpinner;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.SkeletonLoader = __ds_scope.SkeletonLoader;

__ds_ns.ToastProvider = __ds_scope.ToastProvider;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.X = __ds_scope.X;

__ds_ns.Menu = __ds_scope.Menu;

__ds_ns.CheckCircle2 = __ds_scope.CheckCircle2;

__ds_ns.AlertCircle = __ds_scope.AlertCircle;

__ds_ns.RootLayout = __ds_scope.RootLayout;

})();
