import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import './LandingPage.scss';

const LandingPage: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const navigate = useNavigate();

  const handleStartClick = () => {
    setIsStarted(true);
    setTimeout(() => {
      navigate({ to: '/sign-in' });
    }, 1500);
  };

  return (
    <div className={`landing-page ${isStarted ? 'started' : ''}`}>
      {/* Who made this text */}
      <div className="who-made-text">Who made this !</div>

      {/* Title */}
      <div className="title-section">
        <img
          src="/src/assets/images/intro-title.svg"
          alt="DeepDirect Logo"
          className="logo-image"
        />
        <div className="web-ide-title">WEB IDE</div>
      </div>

      {/* Hello text */}
      <div className="hello-text">Hello?</div>

      {/* Logo with animation */}
      <div className="logo-section">
        <div className={`logo ${isStarted ? 'logo--started' : ''}`}>
          <img src="/src/assets/images/bare-face.svg" alt="Bare Face Logo" className="logo-image" />
          <img src="/src/assets/images/glasses.svg" alt="Glasses Logo" className="glasses-image" />
        </div>
      </div>

      {/* Start Button */}
      <div className="start-button-container">
        <button className="start-button" onClick={handleStartClick} disabled={isStarted}>
          {isStarted ? "Let's Go!" : 'Start'}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
