const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const taskCategory = document.getElementById('taskCategory');
const tasksContainer = document.getElementById('tasksContainer');
const totalTasksEl = document.getElementById('totalTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const completedTasksEl = document.getElementById('completedTasks');
const overdueTasksEl = document.getElementById('overdueTasks');
const productivityScoreEl = document.getElementById('productivityScore');
const productivityMessageEl = document.getElementById('productivityMessage');
const scoreCircle = document.getElementById('scoreCircle');
const suggestionsList = document.getElementById('suggestionsList');
const badgeContainer = document.getElementById('badgeContainer');
const todayDateEl = document.getElementById('todayDate');
const filterButtons = document.querySelectorAll('.tab-btn');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const taskCountLabel = document.getElementById('taskCountLabel');
const themeToggle = document.getElementById('themeToggle');
const resetFormButton = document.getElementById('resetForm');
const formStatus = document.getElementById('formStatus');

let tasks = [];
let activeFilter = 'all';
let searchQuery = '';
let sortOption = 'date';
let editTaskId = null;

const STORAGE_KEY = 'smartTodoProTasks';
const THEME_KEY = 'smartTodoProTheme';

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTodayString() {
  const today = new Date();
  return today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const storedTasks = localStorage.getItem(STORAGE_KEY);
  if (storedTasks) {
    tasks = JSON.parse(storedTasks).map(task => ({ ...task }));
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function loadTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  document.body.classList.toggle('light', theme === 'light');
  themeToggle.querySelector('.toggle-icon').textContent = theme === 'light' ? '🌙' : '☀️';
  themeToggle.querySelector('span').textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
}

function getPriorityWeight(priority) {
  if (priority === 'High') return 3;
  if (priority === 'Medium') return 2;
  return 1;
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(task => {
    return !task.completed && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]);
  }).length;

  totalTasksEl.textContent = total;
  pendingTasksEl.textContent = pending;
  completedTasksEl.textContent = completed;
  overdueTasksEl.textContent = overdue;
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const score = total === 0 ? 0 : Math.round((completed / total) * 100);
  productivityScoreEl.textContent = `${score}%`;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (score / 100) * circumference;
  scoreCircle.style.strokeDashoffset = offset;

  const message = score >= 80 ? 'Excellent work!' : score >= 50 ? 'Good progress!' : 'Needs improvement!';
  productivityMessageEl.textContent = message;
}

function updateSuggestions() {
  const pendingTasks = tasks.filter(task => !task.completed);
  const overdueTasks = pendingTasks.filter(task => new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]));
  const highPriorityPending = pendingTasks.filter(task => task.priority === 'High');
  const completedCount = tasks.filter(task => task.completed).length;

  const suggestions = [];
  if (overdueTasks.length > 0) {
    suggestions.push(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need immediate attention.`);
  }
  if (highPriorityPending.length > 2) {
    suggestions.push('You have too many high-priority tasks. Prioritize or delegate one now.');
  }
  if (pendingTasks.length > 3 && completedCount === 0) {
    suggestions.push('Start with one quick task to build momentum.');
  }
  if (completedCount > 0 && completedCount < 5) {
    suggestions.push('Complete 2 more tasks to improve your productivity score.');
  }
  if (tasks.length === 0) {
    suggestions.push('Add your first task to begin organizing your day.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Your workflow looks stable. Keep the momentum with consistent progress.');
  }

  suggestionsList.innerHTML = suggestions.map(text => `<li>${text}</li>`).join('');
}

function updateBadges() {
  const completedCount = tasks.filter(task => task.completed).length;
  const highPriorityTasks = tasks.filter(task => task.priority === 'High');
  const highPriorityCompleted = highPriorityTasks.every(task => task.completed) && highPriorityTasks.length > 0;

  const badges = [
    { label: 'Task Starter', detail: 'Complete 1 task', earned: completedCount >= 1 },
    { label: 'Productive Day', detail: 'Complete 5 tasks', earned: completedCount >= 5 },
    { label: 'Task Master', detail: 'Complete 10 tasks', earned: completedCount >= 10 },
    { label: 'Priority Hero', detail: 'Finish all high-priority tasks', earned: highPriorityCompleted },
  ];

  badgeContainer.innerHTML = badges.map(badge => {
    return `
      <div class="badge-item ${badge.earned ? 'unlocked' : 'locked'}">
        <strong>${badge.label}</strong>
        <span>${badge.detail}</span>
      </div>
    `;
  }).join('');
}

function getFilteredTasks() {
  return tasks
    .filter(task => {
      if (activeFilter === 'pending') return !task.completed;
      if (activeFilter === 'completed') return task.completed;
      return true;
    })
    .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'priority') {
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      }
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
}

function renderTasks() {
  const visibleTasks = getFilteredTasks();
  taskCountLabel.textContent = `${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'}`;

  if (visibleTasks.length === 0) {
    tasksContainer.innerHTML = '<p class="empty-state">No tasks found. Add a new task or change your filters.</p>';
    return;
  }

  tasksContainer.innerHTML = visibleTasks.map(task => {
    const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]);
    return `
      <article class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
        <div class="task-header">
          <h4 class="task-title ${task.completed ? 'completed' : ''}">${task.title}</h4>
          <div class="badge-row">
            <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
            <span class="badge category">${task.category}</span>
          </div>
        </div>
        <p class="task-desc">${task.description || 'No description added.'}</p>
        <div class="task-meta">
          <span>Due ${formatDate(task.dueDate)}</span>
          <span>${task.completed ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}</span>
        </div>
        <div class="task-actions">
          <button class="action-btn complete" data-action="toggle" data-id="${task.id}">${task.completed ? 'Undo' : 'Complete'}</button>
          <button class="action-btn" data-action="edit" data-id="${task.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </article>
    `;
  }).join('');
}

function resetForm() {
  editTaskId = null;
  taskForm.reset();
  formStatus.textContent = 'Add task';
}

function addTask(event) {
  event.preventDefault();
  const title = taskTitle.value.trim();
  const description = taskDescription.value.trim();
  const dueDate = taskDueDate.value;
  const priority = taskPriority.value;
  const category = taskCategory.value;

  if (!title || !dueDate) return;

  if (editTaskId) {
    const target = tasks.find(task => task.id === editTaskId);
    if (target) {
      Object.assign(target, { title, description, dueDate, priority, category });
    }
    editTaskId = null;
  } else {
    tasks.push({
      id: Date.now().toString(),
      title,
      description,
      dueDate,
      priority,
      category,
      completed: false,
    });
  }

  saveTasks();
  updateStats();
  updateProgress();
  updateSuggestions();
  updateBadges();
  renderTasks();
  resetForm();
}

function handleTaskAction(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  if (action === 'toggle') {
    task.completed = !task.completed;
  }
  if (action === 'edit') {
    editTaskId = task.id;
    taskTitle.value = task.title;
    taskDescription.value = task.description;
    taskDueDate.value = task.dueDate;
    taskPriority.value = task.priority;
    taskCategory.value = task.category;
    formStatus.textContent = 'Edit task';
    taskTitle.focus();
  }
  if (action === 'delete') {
    const confirmed = confirm('Delete this task permanently?');
    if (!confirmed) return;
    tasks = tasks.filter(item => item.id !== id);
  }

  saveTasks();
  updateStats();
  updateProgress();
  updateSuggestions();
  updateBadges();
  renderTasks();
}

function updateFilter(newFilter) {
  activeFilter = newFilter;
  filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === newFilter));
  renderTasks();
}

function updateTheme() {
  const isLight = document.body.classList.toggle('light');
  saveTheme(isLight ? 'light' : 'dark');
  themeToggle.querySelector('.toggle-icon').textContent = isLight ? '🌙' : '☀️';
  themeToggle.querySelector('span').textContent = isLight ? 'Dark Mode' : 'Light Mode';
}

function init() {
  todayDateEl.textContent = getTodayString();
  loadTheme();
  loadTasks();
  updateStats();
  updateProgress();
  updateSuggestions();
  updateBadges();
  renderTasks();

  taskForm.addEventListener('submit', addTask);
  resetFormButton.addEventListener('click', resetForm);
  tasksContainer.addEventListener('click', handleTaskAction);
  searchInput.addEventListener('input', event => {
    searchQuery = event.target.value;
    renderTasks();
  });
  sortSelect.addEventListener('change', event => {
    sortOption = event.target.value;
    renderTasks();
  });
  filterButtons.forEach(button => {
    button.addEventListener('click', () => updateFilter(button.dataset.filter));
  });
  themeToggle.addEventListener('click', updateTheme);
}

init();
