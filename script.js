window.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'todoit.tasks';
  const todoCard = document.getElementById('todoCard');
  if (!todoCard) return;

  const input = todoCard.querySelector('#taskInput');
  const pendingList = todoCard.querySelector('.todo-list__items--pending');
  const completedList = todoCard.querySelector('.todo-list__items--completed');
  const listWrapper = todoCard.querySelector('.todo-list__lists');
  const divider = todoCard.querySelector('.todo-list__divider');
  const inputWrapper = todoCard.querySelector('.todo-list__input');

  if (!input || !pendingList || !completedList || !listWrapper || !divider || !inputWrapper) {
    return;
  }

  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const loadTasks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => {
          if (typeof item === 'string') {
            return { id: createId(), text: item, completed: false, completedAt: null };
          }
          if (item && typeof item.text === 'string') {
            return {
              id: item.id || createId(),
              text: item.text,
              completed: Boolean(item.completed),
              completedAt: item.completed ? Number(item.completedAt) || Date.now() : null,
            };
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Unable to load tasks', error);
      return [];
    }
  };

  let tasks = loadTasks();

  const trimCompletedTasks = () => {
    const completedEntries = tasks
      .filter((task) => task.completed)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    if (completedEntries.length <= 2) {
      return false;
    }

    const allowedIds = new Set(completedEntries.slice(0, 2).map((entry) => entry.id));
    const originalLength = tasks.length;

    tasks = tasks.filter((task) => !task.completed || allowedIds.has(task.id));
    return tasks.length !== originalLength;
  };

  const saveTasks = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Unable to save tasks', error);
    }
  };

  const createTaskElement = (task, index) => {
    const taskItem = document.createElement('li');
    taskItem.className = 'todo-item';
    if (task.completed) {
      taskItem.classList.add('todo-item--complete');
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-item__text';
    textSpan.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'todo-item__actions';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'todo-item__toggle';
    toggleButton.dataset.index = String(index);
    toggleButton.setAttribute('aria-pressed', task.completed ? 'true' : 'false');
    toggleButton.setAttribute(
      'aria-label',
      `${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${task.text}`
    );
    if (task.completed) {
      toggleButton.classList.add('is-active');
    }

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'todo-item__delete';
    deleteButton.dataset.index = String(index);
    deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteButton.textContent = '×';

    actions.append(toggleButton, deleteButton);

    taskItem.append(textSpan, actions);
    return taskItem;
  };

  const updateListVisibility = () => {
    const hasPending = pendingList.childElementCount > 0;
    const hasCompleted = completedList.childElementCount > 0;

    divider.classList.toggle('todo-list__divider--visible', hasCompleted);
    completedList.hidden = !hasCompleted;

    if (!hasPending && !hasCompleted) {
      inputWrapper.classList.remove('todo-list__input--hidden');
      input.placeholder = 'Type a task and press Enter';
    } else {
      inputWrapper.classList.add('todo-list__input--hidden');
      input.placeholder = '';
    }
  };

  const renderTasks = () => {
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    const completedTasks = [];

    tasks.forEach((task, index) => {
      if (task.completed) {
        completedTasks.push({ task, index });
      } else {
        pendingList.appendChild(createTaskElement(task, index));
      }
    });

    completedTasks
      .sort((a, b) => (b.task.completedAt || 0) - (a.task.completedAt || 0))
      .forEach(({ task, index }) => {
        completedList.appendChild(createTaskElement(task, index));
      });

    updateListVisibility();
  };

  const addTask = (taskText) => {
    tasks = [...tasks, { id: createId(), text: taskText, completed: false, completedAt: null }];
    trimCompletedTasks();
    saveTasks();
    renderTasks();
  };

  const toggleTask = (taskIndex) => {
    const index = Number(taskIndex);
    if (Number.isNaN(index) || index < 0 || index >= tasks.length) return;

    const updatedTask = { ...tasks[index] };
    updatedTask.completed = !updatedTask.completed;
    updatedTask.completedAt = updatedTask.completed ? Date.now() : null;

    tasks = tasks.map((task, idx) => (idx === index ? updatedTask : task));

    trimCompletedTasks();
    saveTasks();
    renderTasks();
  };

  const deleteTask = (taskIndex) => {
    const index = Number(taskIndex);
    if (Number.isNaN(index) || index < 0 || index >= tasks.length) return;

    tasks = tasks.filter((_, idx) => idx !== index);
    trimCompletedTasks();
    saveTasks();
    renderTasks();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      input.value = '';
      return;
    }

    addTask(value);
    input.value = '';
  });

  listWrapper.addEventListener('click', (event) => {
    const toggleButton = event.target.closest('.todo-item__toggle');
    if (toggleButton) {
      toggleTask(toggleButton.dataset.index);
      return;
    }

    const deleteButton = event.target.closest('.todo-item__delete');
    if (deleteButton) {
      deleteTask(deleteButton.dataset.index);
    }
  });

  trimCompletedTasks();
  saveTasks();
  renderTasks();
  input.focus();
});
