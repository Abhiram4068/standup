import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import ProjectList from './pages/ProjectList';
import TaskList from './pages/TaskList';
import NoteProjectList from './pages/NoteProjectList';
import NoteList from './pages/NoteList';
import NoteDetail from './pages/NoteDetail';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ProjectList />} />
          <Route path="project/:id" element={<TaskList />} />
          <Route path="notes" element={<NoteProjectList />} />
          <Route path="notes/project/:id" element={<NoteList />} />
          <Route path="notes/note/:id" element={<NoteDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
