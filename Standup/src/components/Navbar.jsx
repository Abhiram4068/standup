import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProject, getProjects } from '../services/api';

const Navbar = ({ searchQuery, setSearchQuery, onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [projectDetails, setProjectDetails] = useState(null);
  const [projectCount, setProjectCount] = useState(null);

  useEffect(() => {
    if (location.pathname === '/') {
      getProjects().then(res => {
        if (res.success) {
          setProjectCount(res.data.length);
        }
      });
      setProjectDetails(null);
    } else if (location.pathname.startsWith('/project/')) {
      const projectId = location.pathname.split('/')[2];
      if (projectId) {
        getProject(projectId).then(res => {
          if (res.success) {
            setProjectDetails(res.data);
          }
        });
      }
    } else {
      setProjectDetails(null);
    }
  }, [location.pathname]);

  let title = 'Projects';
  let subtitle = projectCount !== null ? `${projectCount} active projects` : 'Active projects';
  let description = null;
  let showSearch = true;

  if (location.pathname.startsWith('/project/')) {
    title = projectDetails ? projectDetails.project_name : 'Loading...';
    subtitle = null;
    description = projectDetails ? projectDetails.description : null;
    showSearch = false;
    
    const initial = projectDetails && projectDetails.project_name 
      ? projectDetails.project_name.charAt(0).toUpperCase() 
      : '...';

  }

  return (
    <div className={location.pathname === '/' ? "topbar" : "detail-header"}>
      <div className={location.pathname === '/' ? "title-block" : "detail-title-row"} style={{ display: 'flex', alignItems: 'center' }}>
        <button className="hamburger-btn" onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px', fontSize: '20px', display: 'none' }}>
          ☰
        </button>
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {description && <p className="project-description" style={{ fontSize: '13px', color: 'var(--text-secondary, #888)', marginTop: '4px' }}>{description}</p>}
        </div>
      </div>
      <div className="topbar-right">
        {showSearch && (
          <div className="search">
            <span style={{ marginRight: '6px' }}></span>
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', width: '100%', fontSize: '13px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
