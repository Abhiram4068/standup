const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// In-memory cache to prevent redundant 5-second Apps Script cold starts
const cache = {
  projects: null,
  tasks: {}, // { [projectId]: taskList }
  projectDetails: {} // { [projectId]: details }
};

export function clearCache(type, id = null) {
  if (type === 'projects') cache.projects = null;
  if (type === 'tasks') {
    if (id) delete cache.tasks[id];
    else cache.tasks = {};
  }
}export async function getProjects() {
  if (cache.projects) return { success: true, data: cache.projects };

  const response = await fetch(`${API_BASE_URL}?action=getProjects`);
  const data = await response.json();
  if (data.success) cache.projects = data.data;
  return data;
}

export async function getProject(projectId) {
  if (cache.projectDetails[projectId]) return { success: true, data: cache.projectDetails[projectId] };

  const response = await fetch(`${API_BASE_URL}?action=getProject&projectId=${projectId}`);
  const data = await response.json();
  if (data.success) cache.projectDetails[projectId] = data.data;
  return data;
}

export async function getTasks(projectId) {
  if (projectId && cache.tasks[projectId]) return { success: true, data: cache.tasks[projectId] };
  if (!projectId && cache.tasks['all']) return { success: true, data: cache.tasks['all'] };

  const url = projectId
    ? `${API_BASE_URL}?action=getTasks&projectId=${projectId}`
    : `${API_BASE_URL}?action=getTasks`;
    
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.success) {
    if (projectId) cache.tasks[projectId] = data.data;
    else cache.tasks['all'] = data.data;
  }
  return data;
}

export async function getTask(taskId) {
  const response = await fetch(`${API_BASE_URL}?action=getTask&taskId=${taskId}`);
  return response.json();
}

// Helper to make POST requests
async function postData(action, data = {}) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    // Using text/plain prevents CORS preflight requests in simple cases
    headers: { 'Content-Type': 'text/plain' }, 
    body: JSON.stringify({ action, data })
  });
  return response.json();
}

export async function createProject(data) {
  const result = await postData('createProject', data);
  if (result.success) clearCache('projects');
  return result;
}

export async function updateProject(data) {
  const result = await postData('updateProject', data);
  if (result.success) clearCache('projects');
  return result;
}

export async function deleteProject(projectId) {
  const result = await postData('deleteProject', { projectId });
  if (result.success) clearCache('projects');
  return result;
}

export async function createTask(data) {
  const result = await postData('createTask', data);
  if (result.success) {
    const newTask = (typeof result.data === 'object' && result.data !== null) ? result.data : {
      task_id: result.data || `TASK-${Date.now()}`,
      project_id: data.project_id,
      task: data.task,
      task_description: data.task_description,
      task_type: data.task_type,
      priority: data.priority,
      status: data.status || 'Todo',
      created_at: new Date().toISOString()
    };
    if (data.project_id && cache.tasks[data.project_id]) {
      cache.tasks[data.project_id] = [...cache.tasks[data.project_id], newTask];
    }
    if (cache.tasks['all']) {
      cache.tasks['all'] = [...cache.tasks['all'], newTask];
    }
  }
  return result;
}

export async function updateTask(data) {
  const result = await postData('updateTask', data);
  if (result.success) {
    const updatedTask = (typeof result.data === 'object' && result.data !== null) ? result.data : {
      task_id: data.taskId,
      project_id: data.project_id,
      task: data.task,
      task_description: data.task_description,
      task_type: data.task_type,
      priority: data.priority,
      status: data.status,
      modified_at: new Date().toISOString()
    };
    
    const updateList = (list) => list ? list.map(t => t.task_id === data.taskId ? { ...t, ...updatedTask } : t) : list;
    
    if (data.project_id && cache.tasks[data.project_id]) {
      cache.tasks[data.project_id] = updateList(cache.tasks[data.project_id]);
    }
    if (cache.tasks['all']) {
      cache.tasks['all'] = updateList(cache.tasks['all']);
    }
  }
  return result;
}

export async function deleteTask(taskId) {
  const result = await postData('deleteTask', { taskId });
  if (result.success) {
    for (let key in cache.tasks) {
      if (cache.tasks[key]) {
        cache.tasks[key] = cache.tasks[key].filter(t => t.task_id !== taskId);
      }
    }
  }
  return result;
}
