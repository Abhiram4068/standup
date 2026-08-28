import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getNoteProjects, createNoteProject, deleteNoteProject } from '../services/api';

const NoteProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Project Form State
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete Project State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchProjects = async () => {
    try {
      const result = await getNoteProjects();
      if (result.success) {
        setProjects(result.data);
      } else {
        setError(result.error || 'Failed to load note projects');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenProject = (id) => {
    navigate(`/notes/project/${id}`);
  };

  const openDeleteModal = (e, project) => {
    e.stopPropagation(); // prevent clicking the card
    setSelectedProject(project);
    setActionError('');
    setDeleteModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      const result = await deleteNoteProject(selectedProject.project_id);
      if (result.success) {
        setDeleteModalOpen(false);
        setProjects(projects.filter(p => p.project_id !== selectedProject.project_id));
      } else {
        setActionError(result.error || 'Failed to delete note project');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const result = await createNoteProject({
        project_name: projectName,
        description: description
      });

      if (result.success) {
        const newProject = (typeof result.data === 'object' && result.data !== null) ? result.data : {
          project_id: result.data || `NP-${Date.now()}`,
          project_name: projectName,
          description: description,
          created_at: new Date().toISOString()
        };
        setProjects([...projects, newProject]);
        setProjectName('');
        setDescription('');
      } else {
        setCreateError(result.error || 'Failed to create note project');
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const { searchQuery } = useOutletContext() || { searchQuery: '' };

  const filteredProjects = (projects || [])
    .filter(p => p.project_name.toLowerCase().includes((searchQuery || '').toLowerCase()))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--orange)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px', fontWeight: 500, letterSpacing: '-0.01em', opacity: 0.7 }}>This may take a moment. Please wait.</div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '26px 0', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <>
      <div style={{ marginBottom: '24px', background: 'var(--white)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>Quick Create Note Project</h3>
        {createError && <div style={{ color: 'red', marginBottom: '10px' }}>{createError}</div>}
        <form className="quick-create-form" onSubmit={handleCreateProject} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Project Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Design Notes" 
              required 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '13px' }} 
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Description</label>
            <input 
              type="text"
              placeholder="Project description..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '13px' }}
            />
          </div>
          <div>
            <button type="submit" className="btn-primary" disabled={creating} style={{ marginLeft: 0, height: '37px' }}>
              {creating ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {filteredProjects.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: 'var(--gray-500)', background: 'var(--white)', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', marginTop: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🗒️</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>No note projects found.</div>
          <div style={{ fontSize: '13px' }}>Try adjusting your search query or create a new note project above to get started.</div>
        </div>
      ) : (
        <div className="project-grid">
          {filteredProjects.map((project) => (
            <div key={project.project_id} className="project-card" onClick={() => handleOpenProject(project.project_id)}>
              <div className="project-top">
                <div className="project-icon" style={{ background: '#3b82f6' }}>
                  {project.project_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="project-name">{project.project_name}</div>
                  <div className="project-key">{project.project_id}</div>
                </div>
              </div>
              
              <div className="project-foot" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button 
                  onClick={(e) => openDeleteModal(e, project)} 
                  style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedProject && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Delete Note Project</h3>
              <button className="modal-close" onClick={() => setDeleteModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedProject.project_name}</strong>?</p>
              {actionError && <div style={{ color: 'red', marginTop: '10px' }}>{actionError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteProject} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default NoteProjectList;
