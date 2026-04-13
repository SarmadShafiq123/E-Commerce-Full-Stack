const Spinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex items-center justify-center py-16">
      <div className={`${s} border-2 border-[#EAEAEA] border-t-[#1A1A1A] rounded-full animate-spin`} />
    </div>
  );
};

export default Spinner;
