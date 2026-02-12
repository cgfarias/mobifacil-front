const Divider = ({ orientation = 'horizontal', label }) => {
    if (orientation === 'vertical') {
      return <div className="border-l border-gray-300 h-8 mx-4" />;
    }
  
    if (label) {
      return (
        <div className="flex items-center gap-2 my-4">
          <div className="flex-grow border-t border-gray-300" />
          <span className="text-gray-500 text-sm">{label}</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>
      );
    }
  
    return <div className="border-t border-gray-200 my-4" />;
  };
  
  export default Divider;
  