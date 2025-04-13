
// Global Variables
let tasks = [];
let selectedFilter = 'all';
let sortMethod = 'priority';
let isDarkMode = false;
let activeTimers = {};

// Timer Settings
const timerSettings = {
  pomodoro: {
    workTime: 25,   // minutes
    breakTime: 5,   // minutes
  },
  study: {
    sessionTime: 45 // minutes
  },
  distraction: {
    sessionTime: 60 // minutes
  }
};

let activeTimerMode = null;
let timerState = 'idle'; // idle, running, paused, complete
let timeRemaining = 0;
let timerInterval = null;
let isBreak = false;

// DOM Elements
const clockDisplay = document.getElementById('clock');
const themeToggle = document.getElementById('theme-toggle');
const addTaskBtn = document.getElementById('add-task-btn');
const addFirstTaskBtn = document.getElementById('add-first-task');
const tasksContainer = document.getElementById('tasks-container');
const addTaskModal = document.getElementById('add-task-modal');
const editTaskModal = document.getElementById('edit-task-modal');
const addTaskForm = document.getElementById('add-task-form');
const editTaskForm = document.getElementById('edit-task-form');
const filterTabs = document.querySelectorAll('.tab');
const sortButtons = document.querySelectorAll('.sort-btn');
const focusTabs = document.querySelectorAll('.focus-tab');
const closeButtons = document.querySelectorAll('.close-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  loadTasks();
  updateTasksDisplay();
  updateStats();
  initEventListeners();
  checkPreferredColorScheme();
});

// Initialize the clock
function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

// Update the clock display
function updateClock() {
  const now = new Date();
  
  // Format time (hours:minutes:seconds AM/PM)
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
  const timeString = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
  
  // Format date (Day, Month, Date, Year)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[now.getDay()];
  const month = months[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();
  const dateString = `${day}, ${month} ${date}, ${year}`;
  
  // Update DOM
  document.querySelector('.time').textContent = timeString;
  document.querySelector('.date').textContent = dateString;
  
  // Update task suggestion based on time of day
  updateSuggestion(hours);
}

// Update task suggestion based on time of day
function updateSuggestion(hour) {
  const suggestion = document.querySelector('.suggestion');
  
  if (hour < 9) {
    suggestion.textContent = "Morning is perfect for planning your day and tackling challenging tasks.";
  } else if (hour < 12) {
    suggestion.textContent = "Mid-morning is great for focused work. Consider your high-priority tasks.";
  } else if (hour < 15) {
    suggestion.textContent = "After lunch, focus on collaborative tasks or meetings while your energy is stable.";
  } else if (hour < 18) {
    suggestion.textContent = "Late afternoon is ideal for wrapping up tasks and planning tomorrow.";
  } else {
    suggestion.textContent = "Evening is perfect for light tasks, reading, or learning new skills.";
  }
}

// Check user's preferred color scheme
function checkPreferredColorScheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    toggleDarkMode();
  }
}

// Task Management Functions
function loadTasks() {
  const savedTasks = localStorage.getItem('tasks');
  if (savedTasks) {
    try {
      tasks = JSON.parse(savedTasks, (key, value) => {
        // Convert string dates back to Date objects
        if (key === 'deadline' || key === 'createdAt') {
          return value ? new Date(value) : undefined;
        }
        return value;
      });
    } catch (error) {
      console.error('Failed to parse saved tasks', error);
      tasks = [];
    }
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTask(task) {
  // Generate unique ID
  task.id = Date.now().toString();
  task.createdAt = new Date();
  tasks.push(task);
  saveTasks();
  updateTasksDisplay();
  updateStats();
  showToast('Task added successfully!', 'success');
}

function updateTask(taskId, updates) {
  const index = tasks.findIndex(task => task.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks();
    updateTasksDisplay();
    updateStats();
    showToast('Task updated successfully!', 'success');
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  updateTasksDisplay();
  updateStats();
  showToast('Task deleted', 'info');
}

function toggleTaskStatus(taskId) {
  const task = tasks.find(task => task.id === taskId);
  if (!task) return;
  
  // Cycle through statuses: not-started -> in-progress -> completed -> not-started
  if (task.status === 'not-started') {
    updateTask(taskId, { status: 'in-progress' });
  } else if (task.status === 'in-progress') {
    updateTask(taskId, { status: 'completed' });
    
    // Stop timer if it's running
    if (activeTimers[taskId]) {
      clearInterval(activeTimers[taskId].interval);
      delete activeTimers[taskId];
    }
    
    showToast('Task completed!', 'success');
  } else {
    updateTask(taskId, { status: 'not-started' });
  }
}

// Filter and sort tasks
function getFilteredTasks() {
  let filtered = [...tasks];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Apply filter
  if (selectedFilter === 'today') {
    filtered = filtered.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
  } else if (selectedFilter === 'upcoming') {
    filtered = filtered.filter(task => {
      if (!task.deadline) return true;
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() > today.getTime();
    });
  } else if (selectedFilter === 'completed') {
    filtered = filtered.filter(task => task.status === 'completed');
  }
  
  // Apply sorting
  return filtered.sort((a, b) => {
    if (sortMethod === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortMethod === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortMethod === 'timeAllocation') {
      const timeA = a.timeAllocation || 0;
      const timeB = b.timeAllocation || 0;
      return timeA - timeB;
    }
    return 0;
  });
}

function updateTasksDisplay() {
  const filteredTasks = getFilteredTasks();
  
  // Clear container
  tasksContainer.innerHTML = '';
  
  // Show empty state or tasks
  if (filteredTasks.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <p>No tasks found</p>
        <button class="btn link-btn" id="add-first-task">Add your first task</button>
      </div>
    `;
    document.getElementById('add-first-task').addEventListener('click', () => showModal(addTaskModal));
  } else {
    filteredTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      tasksContainer.appendChild(taskElement);
    });
  }
}

function createTaskElement(task) {
  // Create task item container
  const taskElement = document.createElement('div');
  taskElement.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
  taskElement.setAttribute('data-id', task.id);
  taskElement.draggable = true;
  
  // Get status icon
  let statusIcon = '';
  if (task.status === 'completed') {
    statusIcon = '<i class="fas fa-check-circle text-green-500"></i>';
  } else if (task.status === 'in-progress') {
    statusIcon = '<div class="w-4 h-1 bg-blue-500 rounded"></div>';
  } else {
    statusIcon = '<i class="far fa-circle"></i>';
  }
  
  // Format deadline
  let deadlineDisplay = '';
  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    deadlineDisplay = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  // Check if timer is active for this task
  const hasActiveTimer = activeTimers[task.id] !== undefined;
  const timeSpent = hasActiveTimer ? formatTimeDisplay(activeTimers[task.id].timeSpent) : '';
  
  // Create task HTML
  taskElement.innerHTML = `
    <button class="task-status" onclick="toggleTaskStatus('${task.id}')">
      ${statusIcon}
    </button>
    <div class="task-content">
      <div class="task-header-row">
        <h3 class="task-title">${task.title}</h3>
        <span class="task-badge priority-${task.priority}">${capitalizeFirst(task.priority)} Priority</span>
        ${task.status === 'in-progress' ? '<span class="task-badge status-inprogress">In Progress</span>' : ''}
      </div>
      
      ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
      
      <div class="task-meta">
        ${task.timeAllocation ? `
          <div class="task-meta-item">
            <i class="fas fa-clock"></i> ${task.timeAllocation} min
          </div>
        ` : ''}
        
        ${task.deadline ? `
          <div class="task-meta-item">
            <i class="fas fa-calendar"></i> ${deadlineDisplay}
          </div>
        ` : ''}
      </div>
      
      ${hasActiveTimer ? `
        <div class="task-timer">
          <i class="fas fa-stopwatch"></i>
          <span>Time spent: ${timeSpent}</span>
        </div>
      ` : ''}
    </div>
    
    <div class="task-actions">
      ${task.status !== 'completed' ? `
        <button class="timer-btn ${hasActiveTimer ? 'pause' : 'play'}" onclick="toggleTaskTimer('${task.id}')">
          <i class="fas ${hasActiveTimer ? 'fa-pause' : 'fa-play'}"></i>
          ${hasActiveTimer ? 'Pause' : 'Start'}
        </button>
      ` : ''}
      
      <div class="action-dropdown">
        <button class="action-btn" onclick="toggleDropdown('${task.id}')">
          <i class="fas fa-ellipsis-h"></i>
        </button>
        <div class="dropdown-content" id="dropdown-${task.id}">
          <div class="dropdown-item" onclick="showEditTaskModal('${task.id}')">
            <i class="fas fa-edit"></i> Edit
          </div>
          <div class="dropdown-item delete" onclick="deleteTask('${task.id}')">
            <i class="fas fa-trash"></i> Delete
          </div>
        </div>
      </div>
    </div>
  `;
  
  return taskElement;
}

function toggleDropdown(taskId) {
  const dropdowns = document.querySelectorAll('.dropdown-content');
  dropdowns.forEach(dropdown => {
    if (dropdown.id !== `dropdown-${taskId}`) {
      dropdown.classList.remove('show');
    }
  });
  
  const dropdown = document.getElementById(`dropdown-${taskId}`);
  dropdown.classList.toggle('show');
  
  // Close dropdown when clicking outside
  window.onclick = function(event) {
    if (!event.target.matches('.action-btn') && !event.target.matches('.fa-ellipsis-h')) {
      dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
    }
  };
}

function toggleTaskTimer(taskId) {
  const task = tasks.find(task => task.id === taskId);
  if (!task) return;
  
  // If task is already completed, don't allow timer
  if (task.status === 'completed') return;
  
  if (activeTimers[taskId]) {
    // Pause the timer
    clearInterval(activeTimers[taskId].interval);
    const timeSpent = activeTimers[taskId].timeSpent;
    delete activeTimers[taskId];
    showToast(`Paused work on: ${task.title}`, 'info');
    updateTasksDisplay();
  } else {
    // Start the timer
    if (task.status === 'not-started') {
      updateTask(taskId, { status: 'in-progress' });
    }
    
    activeTimers[taskId] = {
      timeSpent: 0,
      startTime: Date.now(),
      interval: setInterval(() => {
        activeTimers[taskId].timeSpent++;
        updateTasksDisplay();
      }, 1000)
    };
    
    showToast(`Started working on: ${task.title}`, 'info');
    updateTasksDisplay();
  }
}

function updateStats() {
  // Update completed today count
  const completedToday = tasks.filter(task => {
    if (task.status !== 'completed') return false;
    const taskDate = new Date(task.createdAt);
    const today = new Date();
    return taskDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
  }).length;
  
  // Update high priority count
  const highPriorityCount = tasks.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  ).length;
  
  // Update time allocated
  const totalTimeAllocated = Math.round(tasks.reduce(
    (total, task) => total + (task.timeAllocation || 0), 0) / 60
  );
  
  // Update stats display
  document.getElementById('completed-count').textContent = completedToday;
  document.getElementById('priority-count').textContent = highPriorityCount;
  document.getElementById('time-count').textContent = `${totalTimeAllocated} hrs`;
}

// Focus Tools Functions
function setActiveTimerMode(mode) {
  activeTimerMode = mode;
  resetTimer();
  
  // Set initial time based on mode
  if (mode === 'pomodoro') {
    timeRemaining = timerSettings.pomodoro.workTime * 60;
  } else if (mode === 'study') {
    timeRemaining = timerSettings.study.sessionTime * 60;
  } else if (mode === 'distraction-free') {
    timeRemaining = timerSettings.distraction.sessionTime * 60;
  }
  
  updateTimerDisplay();
}

function startTimer() {
  if (!activeTimerMode) return;
  
  timerState = 'running';
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    
    // Update progress bar
    updateTimerProgress();
    
    if (timeRemaining <= 0) {
      completeTimer();
    }
  }, 1000);
  
  // Check if mute notifications is enabled
  if (document.getElementById('mute-notifications')?.checked) {
    showToast('Notifications muted during focus session', 'info');
  }
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerState = 'paused';
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerState = 'idle';
  isBreak = false;
  
  // Reset time based on active mode
  if (activeTimerMode === 'pomodoro') {
    timeRemaining = timerSettings.pomodoro.workTime * 60;
  } else if (activeTimerMode === 'study') {
    timeRemaining = timerSettings.study.sessionTime * 60;
  } else if (activeTimerMode === 'distraction-free') {
    timeRemaining = timerSettings.distraction.sessionTime * 60;
  }
  
  updateTimerDisplay();
  updateTimerProgress(0);
  
  // Update button text
  const startBtn = document.querySelector(`#${activeTimerMode}-start`);
  if (startBtn) {
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
  }
}

function completeTimer() {
  clearInterval(timerInterval);
  timerState = 'complete';
  
  if (activeTimerMode === 'pomodoro' && !isBreak) {
    showToast('Time for a break!', 'success');
    isBreak = true;
    timeRemaining = timerSettings.pomodoro.breakTime * 60;
    
    // Update timer title
    const timerTitle = document.querySelector(`#pomodoro-panel .timer-title`);
    if (timerTitle) {
      timerTitle.textContent = 'Break Time';
    }
    
    updateTimerDisplay();
    startTimer();
  } else if (activeTimerMode === 'pomodoro' && isBreak) {
    showToast('Break finished! Ready to work?', 'success');
    isBreak = false;
    timeRemaining = timerSettings.pomodoro.workTime * 60;
    
    // Update timer title
    const timerTitle = document.querySelector(`#pomodoro-panel .timer-title`);
    if (timerTitle) {
      timerTitle.textContent = 'Focus Time';
    }
    
    updateTimerDisplay();
    resetTimer();
  } else {
    showToast('Session complete!', 'success');
    resetTimer();
  }
}

function updateTimerDisplay() {
  if (!activeTimerMode) return;
  
  const timerDisplay = document.querySelector(`#${activeTimerMode}-panel .timer-display`);
  if (timerDisplay) {
    timerDisplay.textContent = formatTimeDisplay(timeRemaining);
  }
}

function updateTimerProgress() {
  if (!activeTimerMode) return;
  
  let totalTime = 0;
  
  if (activeTimerMode === 'pomodoro') {
    totalTime = isBreak ? timerSettings.pomodoro.breakTime * 60 : timerSettings.pomodoro.workTime * 60;
  } else if (activeTimerMode === 'study') {
    totalTime = timerSettings.study.sessionTime * 60;
  } else if (activeTimerMode === 'distraction-free') {
    totalTime = timerSettings.distraction.sessionTime * 60;
  }
  
  const progressPercentage = ((totalTime - timeRemaining) / totalTime) * 100;
  const progressBar = document.querySelector(`#${activeTimerMode}-panel .progress-fill`);
  
  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
  }
}

function formatTimeDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Utility Functions
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode');
  
  // Update icon
  themeToggle.innerHTML = isDarkMode ? 
    '<i class="fas fa-sun"></i>' : 
    '<i class="fas fa-moon"></i>';
}

function showModal(modal) {
  modal.classList.add('show');
}

function hideModal(modal) {
  modal.classList.remove('show');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  const toastContainer = document.getElementById('toast-container');
  toastContainer.appendChild(toast);
  
  // Auto remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function showEditTaskModal(taskId) {
  const task = tasks.find(task => task.id === taskId);
  if (!task) return;
  
  // Fill form fields
  document.getElementById('edit-task-id').value = task.id;
  document.getElementById('edit-task-title').value = task.title;
  document.getElementById('edit-task-description').value = task.description || '';
  document.getElementById('edit-task-time').value = task.timeAllocation || '';
  document.getElementById('edit-task-priority').value = task.priority;
  document.getElementById('edit-task-status').value = task.status;
  
  // Format date for input
  if (task.deadline) {
    const date = new Date(task.deadline);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    document.getElementById('edit-task-deadline').value = `${year}-${month}-${day}`;
  } else {
    document.getElementById('edit-task-deadline').value = '';
  }
  
  // Show modal
  showModal(editTaskModal);
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Event Listeners
function initEventListeners() {
  // Theme toggle
  themeToggle.addEventListener('click', toggleDarkMode);
  
  // Add task button
  addTaskBtn.addEventListener('click', () => showModal(addTaskModal));
  
  // Close buttons for modals
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      hideModal(addTaskModal);
      hideModal(editTaskModal);
    });
  });
  
  // Add task form submission
  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskData = {
      title: document.getElementById('task-title').value,
      description: document.getElementById('task-description').value || undefined,
      priority: document.getElementById('task-priority').value,
      status: 'not-started'
    };
    
    const deadline = document.getElementById('task-deadline').value;
    if (deadline) {
      taskData.deadline = new Date(deadline);
    }
    
    const timeAllocation = document.getElementById('task-time').value;
    if (timeAllocation) {
      taskData.timeAllocation = parseInt(timeAllocation);
    }
    
    addTask(taskData);
    addTaskForm.reset();
    hideModal(addTaskModal);
  });
  
  // Edit task form submission
  editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('edit-task-id').value;
    const updates = {
      title: document.getElementById('edit-task-title').value,
      description: document.getElementById('edit-task-description').value || undefined,
      priority: document.getElementById('edit-task-priority').value,
      status: document.getElementById('edit-task-status').value
    };
    
    const deadline = document.getElementById('edit-task-deadline').value;
    if (deadline) {
      updates.deadline = new Date(deadline);
    } else {
      updates.deadline = undefined;
    }
    
    const timeAllocation = document.getElementById('edit-task-time').value;
    if (timeAllocation) {
      updates.timeAllocation = parseInt(timeAllocation);
    } else {
      updates.timeAllocation = undefined;
    }
    
    updateTask(taskId, updates);
    editTaskForm.reset();
    hideModal(editTaskModal);
  });
  
  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      filterTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Update selected filter
      selectedFilter = tab.getAttribute('data-filter');
      
      // Update tasks display
      updateTasksDisplay();
    });
  });
  
  // Sort buttons
  sortButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      sortButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Update sort method
      sortMethod = button.getAttribute('data-sort');
      
      // Update tasks display
      updateTasksDisplay();
    });
  });
  
  // Focus tabs
  focusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and panels
      focusTabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.focus-panel').forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Get mode from data attribute
      const mode = tab.getAttribute('data-mode');
      
      // Show corresponding panel
      document.getElementById(`${mode}-panel`).classList.add('active');
      
      // Set active timer mode
      setActiveTimerMode(mode);
    });
  });
  
  // Timer controls
  document.getElementById('pomodoro-start').addEventListener('click', function() {
    if (timerState === 'running') {
      pauseTimer();
      this.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
      startTimer();
      this.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
  });
  
  document.getElementById('study-start').addEventListener('click', function() {
    if (timerState === 'running') {
      pauseTimer();
      this.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
      startTimer();
      this.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
  });
  
  document.getElementById('focus-start').addEventListener('click', function() {
    if (timerState === 'running') {
      pauseTimer();
      this.innerHTML = '<i class="fas fa-play"></i> Resume';
    } else {
      startTimer();
      this.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
  });
  
  document.getElementById('pomodoro-reset').addEventListener('click', resetTimer);
  document.getElementById('study-reset').addEventListener('click', resetTimer);
  document.getElementById('focus-reset').addEventListener('click', resetTimer);
  
  // Timer settings
  document.getElementById('work-time').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('work-time-value').textContent = value;
    timerSettings.pomodoro.workTime = parseInt(value);
    if (activeTimerMode === 'pomodoro' && !isBreak && timerState === 'idle') {
      timeRemaining = timerSettings.pomodoro.workTime * 60;
      updateTimerDisplay();
    }
  });
  
  document.getElementById('break-time').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('break-time-value').textContent = value;
    timerSettings.pomodoro.breakTime = parseInt(value);
  });
  
  document.getElementById('session-time').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('session-time-value').textContent = value;
    timerSettings.study.sessionTime = parseInt(value);
    if (activeTimerMode === 'study' && timerState === 'idle') {
      timeRemaining = timerSettings.study.sessionTime * 60;
      updateTimerDisplay();
    }
  });
  
  // Initialize the pomodoro timer mode by default
  setActiveTimerMode('pomodoro');
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === addTaskModal) {
      hideModal(addTaskModal);
    } else if (e.target === editTaskModal) {
      hideModal(editTaskModal);
    }
  });
  
  // Make toggle task status function global
  window.toggleTaskStatus = toggleTaskStatus;
  window.toggleDropdown = toggleDropdown;
  window.showEditTaskModal = showEditTaskModal;
  window.toggleTaskTimer = toggleTaskTimer;
  window.deleteTask = deleteTask;
}
