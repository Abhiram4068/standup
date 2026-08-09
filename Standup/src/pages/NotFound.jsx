import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: 'var(--orange)' }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '10px 0 20px', color: 'var(--ink)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--gray-500)', marginBottom: '30px', maxWidth: '400px' }}>
        Oops! We couldn't find the page you were looking for. It might have been removed, renamed, or didn't exist in the first place.
      </p>
      <button 
        className="btn-primary" 
        onClick={() => navigate('/')}
        style={{ marginLeft: 0, padding: '12px 24px', fontSize: '14px' }}
      >
        Go back to Projects
      </button>
    </div>
  );
};

export default NotFound;
