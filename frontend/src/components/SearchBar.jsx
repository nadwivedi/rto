const SearchBar = ({ value, onChange, placeholder, toUpperCase = false }) => {
  const handleChange = (e) => {
    const newValue = toUpperCase ? e.target.value.toUpperCase() : e.target.value;
    onChange(newValue);
  };

  return (
    <div className='relative flex-1 lg:max-w-md'>
      <input
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={`w-full pl-11 pr-4 py-3 text-sm border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all bg-white shadow-sm ${toUpperCase ? 'uppercase' : ''}`}
      />
      <svg
        className='absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
      </svg>
    </div>
  );
};

export default SearchBar;
