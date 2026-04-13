import { Link } from 'react-router-dom';

const TopBar = ({ topBar }) => {
  if (!topBar?.active || !topBar?.text) return null;

  const content = (
    <span className="text-[11px] tracking-[0.2em] uppercase">{topBar.text}</span>
  );

  return (
    <div className="bg-[#1A1A1A] text-white text-center py-2 px-4 sticky top-0 z-50">
      {topBar.link ? (
        <Link to={topBar.link} className="hover:opacity-75 transition duration-300">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};

export default TopBar;
