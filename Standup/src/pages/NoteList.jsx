import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getNotes, getNoteProject, createNote, updateNote, deleteNote } from '../services/api';

const NoteList = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [notes, setNotes] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Note Form State
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [scope, setScope] = useState('Other');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchNotes = async () => {
    try {
      const notesResult = await getNotes(id);
      if (notesResult.success) {
        setNotes(notesResult.data);
      } else {
        setError(notesResult.error || 'Failed to load notes');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const projectResult = await getNoteProject(id);
        if (projectResult.success) {
          setProject(projectResult.data);
        } else {
          setError(projectResult.error || 'Failed to load note project details');
        }
        await fetchNotes();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const result = await createNote({
        project_id: id,
        title: title,
        note: note,
        scope: scope
      });

      if (result.success) {
        const newNote = (typeof result.data === 'object' && result.data !== null) ? result.data : {
          note_id: result.data || `N-${Date.now()}`,
          project_id: id,
          title: title,
          note: note,
          scope: scope,
          created_at: new Date().toISOString()
        };
        setNotes([newNote, ...notes]);
        setTitle('');
        setNote('');
        setScope('Other');
      } else {
        setCreateError(result.error || 'Failed to create note');
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openDeleteModal = (e, noteObj) => {
    e.stopPropagation();
    setSelectedNote(noteObj);
    setActionError('');
    setDeleteModalOpen(true);
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    setActionLoading(true);
    try {
      const result = await deleteNote(selectedNote.note_id);
      if (result.success) {
        setDeleteModalOpen(false);
        setNotes(notes.filter(n => n.note_id !== selectedNote.note_id));
      } else {
        setActionError(result.error || 'Failed to delete note');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenNote = (noteId) => {
    navigate(`/notes/note/${noteId}`);
  };

  const handleBack = () => {
    navigate('/notes');
  };

  const getScopePill = (scope) => {
    const s = String(scope || 'Other').toLowerCase();
    if (s === 'client') return <span className="scope-pill scope-client">Client</span>;
    if (s === 'server') return <span className="scope-pill scope-server">Server</span>;
    if (s === 'db') return <span className="scope-pill scope-db">DB</span>;
    return <span className="scope-pill scope-other">{scope || 'Other'}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--orange)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px', fontWeight: 500, letterSpacing: '-0.01em', opacity: 0.7 }}>This may take a moment. Please wait.</div>
      </div>
    );
  }

  if (error) return <div style={{ padding: '26px 0', color: 'red' }}>Error: {error}</div>;

  return (
    <>
      <div className="back-link" onClick={handleBack}>← Back to note projects</div>

      <div style={{ marginBottom: '24px', background: 'var(--white)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>Quick Create Note for {project?.project_name}</h3>
        {createError && <div style={{ color: 'red', marginBottom: '10px' }}>{createError}</div>}
        <form className="quick-create-form" onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Title *</label>
              <input 
                type="text" 
                placeholder="e.g. Meeting details" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '13px' }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Scope</label>
              <select 
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '13px' }}
              >
                <option value="Client">Client</option>
                <option value="Server">Server</option>
                <option value="DB">DB</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <button type="submit" className="btn-primary" disabled={creating} style={{ marginLeft: 0, height: '37px' }}>
                {creating ? 'Saving...' : 'Create Note'}
              </button>
            </div>
          </div>
          <div>
             <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Note Description</label>
             <textarea 
                placeholder="Write your note here..." 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '13px', resize: 'vertical' }} 
              />
          </div>
        </form>
      </div>

      <div className="task-table-wrap">
        <table className="task-table">
          <thead>
            <tr>
              <th className="col-key sortable">Key ↓</th>
              <th className="col-task sortable">Title</th>
              <th className="col-scope">Scope</th>
              <th className="col-due sortable">Created At</th>
              <th className="col-actions" style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!notes || notes.length === 0) ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No notes found for this project.</td>
              </tr>
            ) : (
              notes.map(noteItem => (
                <tr key={noteItem.note_id} onClick={() => handleOpenNote(noteItem.note_id)} style={{ cursor: 'pointer' }}>
                  <td className="col-key">{noteItem.note_id}</td>
                  <td className="col-task" style={{ fontWeight: 500, color: 'var(--ink)' }}>{noteItem.title}</td>
                  <td className="col-scope">{getScopePill(noteItem.scope)}</td>
                  <td className="col-due">{formatDate(noteItem.created_at)}</td>
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenNote(noteItem.note_id)} style={{ background: 'var(--orange-soft)', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}>View Detail</button>
                      <button onClick={(e) => openDeleteModal(e, noteItem)} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && selectedNote && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Delete Note</h3>
              <button className="modal-close" onClick={() => setDeleteModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                Are you sure you want to delete <strong>{selectedNote.note_id} - {selectedNote.title}</strong>? This action cannot be undone.
              </p>
              {actionError && <div style={{ color: 'red', marginTop: '10px', fontSize: '13px' }}>{actionError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteNote} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default NoteList;
