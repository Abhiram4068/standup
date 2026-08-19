const SPREADSHEET_ID = '1NwnTIY12oJGzSIg_pCBbaOKd-zoOyO2GDehIDP57Zw0';

const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

const projectsSheet = spreadsheet.getSheetByName('Projects');
const tasksSheet = spreadsheet.getSheetByName('Tasks');

// ============================================================
// HELPER: PREVENT MEMORY CRASHES
// ============================================================

function getSheetData(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow === 0 || lastCol === 0) {
    return [];
  }
  
  // Cap the rows at 5000 to prevent V8 out-of-memory crashes 
  // caused by accidental formatting in row 50,000+
  const safeRows = Math.min(lastRow, 5000);
  const safeCols = Math.min(lastCol, 20);
  
  return sheet.getRange(1, 1, safeRows, safeCols).getValues();
}

// ============================================================
// GET
// ============================================================

function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getProjects':
        return createResponse({
          success: true,
          data: getProjects()
        });

      case 'getProject':
        return createResponse({
          success: true,
          data: getProject(e.parameter.projectId)
        });

      case 'getTasks':
        return createResponse({
          success: true,
          data: getTasks(e.parameter.projectId)
        });

      case 'getTask':
        return createResponse({
          success: true,
          data: getTask(e.parameter.taskId)
        });

      default:
        return createResponse({
          success: true,
          message: 'Backlog API is running'
        });
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}


// ============================================================
// POST
// ============================================================

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const data = request.data || {};

    switch (action) {
      // ---------------- PROJECTS ----------------
      case 'createProject':
        return createResponse({
          success: true,
          data: createProject(data)
        });

      case 'updateProject':
        return createResponse({
          success: true,
          data: updateProject(data)
        });

      case 'deleteProject':
        return createResponse({
          success: true,
          data: deleteProject(data.projectId)
        });


      // ---------------- TASKS ----------------
      case 'createTask':
        return createResponse({
          success: true,
          data: createTask(data)
        });

      case 'updateTask':
        return createResponse({
          success: true,
          data: updateTask(data)
        });

      case 'deleteTask':
        return createResponse({
          success: true,
          data: deleteTask(data.taskId)
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}


// ============================================================
// PROJECT CRUD
// ============================================================

function getProjects() {
  const data = getSheetData(projectsSheet);

  if (data.length <= 1) {
    return [];
  }

  const taskCounts = getTaskCountsByProject();

  return data.slice(1)
    .filter(row => row[0]) // Skip blank rows (no project_id)
    .map(row => ({
      project_id: row[0],
      project_name: row[1],
      description: row[2],
      created_at: row[3],
      modified_at: row[4],
      task_count: taskCounts[String(row[0])] || 0
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}


function getProject(projectId) {
  if (!projectId) {
    throw new Error('projectId is required');
  }

  const data = getSheetData(projectsSheet);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(projectId)) {
      return {
        project_id: data[i][0],
        project_name: data[i][1],
        description: data[i][2],
        created_at: data[i][3],
        modified_at: data[i][4]
      };
    }
  }

  throw new Error('Project not found');
}


function createProject(data) {
  if (!data.project_name) {
    throw new Error('project_name is required');
  }

  const projectId = generateProjectId();
  const now = new Date();

  projectsSheet.appendRow([
    projectId,
    data.project_name,
    data.description || '',
    now,
    now
  ]);

  return {
    project_id: projectId,
    project_name: data.project_name,
    description: data.description || '',
    created_at: now,
    modified_at: now
  };
}


function updateProject(data) {
  if (!data.projectId) {
    throw new Error('projectId is required');
  }

  const rowNumber = findRowById(projectsSheet, data.projectId);

  if (rowNumber === -1) {
    throw new Error('Project not found');
  }

  const existingRow = projectsSheet
    .getRange(rowNumber, 1, 1, 5)
    .getValues()[0];

  const now = new Date();

  const projectName = data.project_name !== undefined ? data.project_name : existingRow[1];
  const description = data.description !== undefined ? data.description : existingRow[2];

  projectsSheet
    .getRange(rowNumber, 1, 1, 5)
    .setValues([[
      existingRow[0],
      projectName,
      description,
      existingRow[3],
      now
    ]]);

  return {
    project_id: existingRow[0],
    project_name: projectName,
    description: description,
    created_at: existingRow[3],
    modified_at: now
  };
}


function deleteProject(projectId) {
  if (!projectId) {
    throw new Error('projectId is required');
  }

  const rowNumber = findRowById(projectsSheet, projectId);

  if (rowNumber === -1) {
    throw new Error('Project not found');
  }

  // Prevent deletion if the project still has tasks
  const tasks = getTasks(projectId);

  if (tasks.length > 0) {
    throw new Error('Cannot delete project because it contains tasks');
  }

  projectsSheet.deleteRow(rowNumber);

  return {
    project_id: projectId,
    message: 'Project deleted successfully'
  };
}


// ============================================================
// TASK CRUD
// ============================================================

function getTasks(projectId) {
  const data = getSheetData(tasksSheet);

  if (data.length <= 1) {
    return [];
  }

  let tasks = data.slice(1)
    .filter(row => row[0]) // Skip blank rows
    .map(row => ({
      task_id: row[0],
      project_id: row[1],
      task: row[2],
      task_description: row[3],
      task_type: row[4],
      priority: row[5],
      status: row[6],
      created_at: row[7],
      modified_at: row[8],
      scope: row[9] || 'Other'
    }));

  if (projectId) {
    tasks = tasks.filter(task => String(task.project_id) === String(projectId));
  }

  tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return tasks;
}


function getTask(taskId) {
  if (!taskId) {
    throw new Error('taskId is required');
  }

  const data = getSheetData(tasksSheet);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(taskId)) {
      return {
        task_id: data[i][0],
        project_id: data[i][1],
        task: data[i][2],
        task_description: data[i][3],
        task_type: data[i][4],
        priority: data[i][5],
        status: data[i][6],
        created_at: data[i][7],
        modified_at: data[i][8],
        scope: data[i][9] || 'Other'
      };
    }
  }

  throw new Error('Task not found');
}


function createTask(data) {
  if (!data.project_id) throw new Error('project_id is required');
  if (!data.task) throw new Error('task is required');

  // Make sure project exists
  getProject(data.project_id);

  const taskId = generateTaskId();
  const now = new Date();

  tasksSheet.appendRow([
    taskId,
    data.project_id,
    data.task,
    data.task_description || '',
    data.task_type || '',
    data.priority || '',
    data.status || 'Todo',
    now,
    now,
    data.scope || 'Other'
  ]);

  return {
    task_id: taskId,
    project_id: data.project_id,
    task: data.task,
    task_description: data.task_description || '',
    task_type: data.task_type || '',
    priority: data.priority || '',
    status: data.status || 'Todo',
    created_at: now,
    modified_at: now,
    scope: data.scope || 'Other'
  };
}


function updateTask(data) {
  if (!data.taskId) throw new Error('taskId is required');

  const rowNumber = findRowById(tasksSheet, data.taskId);
  if (rowNumber === -1) throw new Error('Task not found');

  const existingRow = tasksSheet.getRange(rowNumber, 1, 1, 10).getValues()[0];
  const now = new Date();

  const projectId = data.project_id !== undefined ? data.project_id : existingRow[1];
  
  if (data.project_id !== undefined) getProject(projectId);

  const task = data.task !== undefined ? data.task : existingRow[2];
  const taskDescription = data.task_description !== undefined ? data.task_description : existingRow[3];
  const taskType = data.task_type !== undefined ? data.task_type : existingRow[4];
  const priority = data.priority !== undefined ? data.priority : existingRow[5];
  const status = data.status !== undefined ? data.status : existingRow[6];
  const scope = data.scope !== undefined ? data.scope : (existingRow[9] || 'Other');

  tasksSheet
    .getRange(rowNumber, 1, 1, 10)
    .setValues([[
      existingRow[0],
      projectId,
      task,
      taskDescription,
      taskType,
      priority,
      status,
      existingRow[7],
      now,
      scope
    ]]);

  return {
    task_id: existingRow[0],
    project_id: projectId,
    task: task,
    task_description: taskDescription,
    task_type: taskType,
    priority: priority,
    status: status,
    created_at: existingRow[7],
    modified_at: now,
    scope: scope
  };
}


function deleteTask(taskId) {
  if (!taskId) throw new Error('taskId is required');

  const rowNumber = findRowById(tasksSheet, taskId);
  if (rowNumber === -1) throw new Error('Task not found');

  tasksSheet.deleteRow(rowNumber);

  return {
    task_id: taskId,
    message: 'Task deleted successfully'
  };
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function findRowById(sheet, id) {
  const data = getSheetData(sheet);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      return i + 1;
    }
  }
  return -1;
}


function generateProjectId() {
  const data = getSheetData(projectsSheet);
  let maxId = 0;

  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0]);
    if (id.startsWith('P')) {
      const number = parseInt(id.substring(1), 10);
      if (!isNaN(number)) maxId = Math.max(maxId, number);
    }
  }

  return 'P' + String(maxId + 1).padStart(3, '0');
}


function getTaskCountsByProject() {
  const data = getSheetData(tasksSheet);
  const counts = {};

  if (data.length <= 1) return counts;

  for (let i = 1; i < data.length; i++) {
    const projectId = String(data[i][1]);
    if (!projectId || projectId === 'undefined' || projectId === '') continue;
    
    counts[projectId] = (counts[projectId] || 0) + 1;
  }

  return counts;
}


function generateTaskId() {
  const data = getSheetData(tasksSheet);
  let maxId = 0;

  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0]);
    if (id.startsWith('T')) {
      const number = parseInt(id.substring(1), 10);
      if (!isNaN(number)) maxId = Math.max(maxId, number);
    }
  }

  return 'T' + String(maxId + 1).padStart(3, '0');
}


// ============================================================
// RESPONSE HELPERS
// ============================================================

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: error.message }))
    .setMimeType(ContentService.MimeType.JSON);
}
