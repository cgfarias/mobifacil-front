import React from 'react';
import PropTypes from 'prop-types';

const UserAvatar = ({
  src,
  alt = 'User avatar',
  name, // Novo prop para gerar iniciais
  size = 'md',
  rounded = 'full',
  border = false,
  borderColor = 'blue-200',
  onlineStatus = null,
  className = '',
  bgColor = 'bg-blue-500', // Cor de fundo para fallback
  textColor = 'text-gray-600', // Cor do texto para fallback
}) => {
  // Tamanhos pré-definidos
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
  };

  // Estilos de borda arredondada
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  // Classes base
  const baseClasses = `inline-flex items-center justify-center overflow-hidden ${
    roundedClasses[rounded]
  } ${border ? `border-2 border-${borderColor}` : ''} ${
    sizeClasses[size]
  } ${className}`;

  // Gerar iniciais a partir do nome
  const getInitials = () => {
    if (!name) return null;
    
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  return (
    <div className="relative inline-flex">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`object-cover ${baseClasses}`}
        />
      ) : (
        <div className={`${baseClasses} ${bgColor} ${textColor} font-medium`}>
          {getInitials() || (
            <svg
              className="h-2/3 w-2/3 opacity-70"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      )}

      {/* Indicador de status online/offline */}
      {onlineStatus !== null && (
        <span
          className={`absolute bottom-0 right-0 block ${
            size === 'xs' || size === 'sm' ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5'
          } rounded-full ${
            onlineStatus ? 'bg-green-500' : 'bg-gray-400'
          } ring-2 ring-white`}
        />
      )}
    </div>
  );
};

UserAvatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  name: PropTypes.string, // Novo prop para gerar iniciais
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'full']),
  border: PropTypes.bool,
  borderColor: PropTypes.string,
  onlineStatus: PropTypes.bool,
  className: PropTypes.string,
  bgColor: PropTypes.string, // Cor de fundo para fallback
  textColor: PropTypes.string, // Cor do texto para fallback
};

export default UserAvatar;