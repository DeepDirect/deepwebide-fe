import PacmanLoader from 'react-spinners/PacmanLoader';

import './Loading.scss';

const Loading: React.FC = () => {
  return (
    <div className="loading-overlay">
      <PacmanLoader className="loading-spinner" color="#ff6500" size={10} />
      <div className="loading-text">Loading...</div>
    </div>
  );
};

export default Loading;
