import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getNote, updateNote } from '../services/api';

const NoteDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // this is the noteId

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editScope, setEditScope] = useState('Other');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchNoteDetail = async () => {
      try {
        const result = await getNote(id);
        if (result.success) {
          setNote(result.data);
          setEditTitle(result.data.title);
          setEditNoteContent(result.data.note);
          setEditScope(result.data.scope);
        } else {
          setError(result.error || 'Failed to load note');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchNoteDetail();
  }, [id]);

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      const result = await updateNote({
        noteId: note.note_id,
        project_id: note.project_id,
        title: editTitle,
        note: editNoteContent,
        scope: editScope
      });

      if (result.success) {
        setNote({
          ...note,
          title: editTitle,
          note: editNoteContent,
          scope: editScope,
          modified_at: new Date().toISOString()
        });
        setIsEditing(false);
      } else {
        setActionError(result.error || 'Failed to update note');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = () => {
    if (note?.project_id) {
      navigate(`/notes/project/${note.project_id}`);
    } else {
      navigate('/notes');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--orange)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px', fontWeight: 500, letterSpacing: '-0.01em', opacity: 0.7 }}>Loading note details...</div>
      </div>
    );
  }

  if (error) return <div style={{ padding: '26px 0', color: 'red' }}>Error: {error}</div>;
  if (!note) return <div style={{ padding: '26px 0' }}>Note not found.</div>;

  return (
    <>
      <div className="back-link" onClick={handleBack}>← Back to Note List</div>

      <div style={{ background: 'var(--white)', padding: '32px', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)', maxWidth: '800px', margin: '0 auto' }}>
        
        {!isEditing ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: 'var(--ink)' }}>{note.title}</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: 'var(--gray-500)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--orange)' }}>{note.note_id}</span>
                  <span>•</span>
                  <span className={`scope-pill scope-${String(note.scope || 'other').toLowerCase()}`}>{note.scope || 'Other'}</span>
                  <span>•</span>
                  <span>Created: {new Date(note.created_at).toLocaleString()}</span>
                  {note.modified_at && note.modified_at !== note.created_at && (
                    <>
                      <span>•</span>
                      <span>Modified: {new Date(note.modified_at).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => setIsEditing(true)} className="btn-secondary">Edit Note</button>
            </div>

            <div style={{ background: 'var(--gray-100)', padding: '24px', borderRadius: 'var(--radius)', minHeight: '300px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--gray-700)', fontSize: '15px' }}>
              {note.note || <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>No description provided. Click edit to add some notes.</span>}
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdateNote}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Edit Note</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => {
                  setIsEditing(false);
                  setEditTitle(note.title);
                  setEditNoteContent(note.note);
                  setEditScope(note.scope);
                  setActionError('');
                }} disabled={actionLoading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {actionError && <div style={{ color: 'red', marginBottom: '16px' }}>{actionError}</div>}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Title *</label>
              <input 
                type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '15px' }} 
              />
            </div>

            <div style={{ marginBottom: '16px', maxWidth: '300px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Scope</label>
              <select value={editScope} onChange={(e) => setEditScope(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '14px' }}>
                <option value="Client">Client</option>
                <option value="Server">Server</option>
                <option value="DB">DB</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Note Content</label>
              <textarea 
                value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '15px', resize: 'vertical', minHeight: '300px', lineHeight: '1.6' }} 
              ></textarea>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default NoteDetail;
