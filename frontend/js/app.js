const STORAGE_KEY = 'cloud-issue-tracker.issues';
const STATUS_SEQUENCE = ['Open', 'In Progress', 'Resolved'];
const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const demoIssues = [
  {
    id: 'issue-101',
    title: 'Fix API timeout on product sync',
    description: 'The nightly sync job occasionally hangs and fails after 60 seconds when traffic spikes.',
    assignee: 'Emma',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-10-18',
    createdAt: '2026-10-11T08:15:00.000Z'
  },
  {
    id: 'issue-102',
    title: 'Review deployment pipeline permissions',
    description: 'Need to authorize deployment credentials for the staging account before the next release.',
    assignee: 'Noah',
    priority: 'Medium',
    status: 'Open',
    dueDate: '2026-10-20',
    createdAt: '2026-10-12T10:30:00.000Z'
  },
  {
    id: 'issue-103',
    title: 'Document incident response checklist',
    description: 'Create a shared checklist for handling customer-impacting alerts and escalations.',
    assignee: 'Chloe',
    priority: 'Low',
    status: 'Resolved',
    dueDate: '2026-10-15',
    createdAt: '2026-10-10T14:00:00.000Z'
  }
];

const issueForm = document.getElementById('issue-form');
const issueList = document.getElementById('issue-list');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const resetDemoButton = document.getElementById('reset-demo');

const stats = {
  total: document.getElementById('stat-total'),
  open: document.getElementById('stat-open'),
  progress: document.getElementById('stat-progress'),
  resolved: document.getElementById('stat-resolved')
};

const state = {
  issues: [],
  searchTerm: '',
  statusFilter: 'all'
};

function loadIssues() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [...demoIssues];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...demoIssues];
    }

    return parsed;
  } catch (error) {
    console.warn('Unable to load saved issues, using demo issues instead.', error);
    return [...demoIssues];
  }
}

function saveIssues() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.issues));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateValue) {
  if (!dateValue) return 'No due date';

  const value = new Date(dateValue);
  if (Number.isNaN(value.getTime())) return 'No due date';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(value);
}

function getStatusClass(value) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function nextStatus(current) {
  const index = STATUS_SEQUENCE.indexOf(current);
  return STATUS_SEQUENCE[(index + 1) % STATUS_SEQUENCE.length];
}

function updateStats() {
  stats.total.textContent = state.issues.length;
  stats.open.textContent = state.issues.filter((issue) => issue.status === 'Open').length;
  stats.progress.textContent = state.issues.filter((issue) => issue.status === 'In Progress').length;
  stats.resolved.textContent = state.issues.filter((issue) => issue.status === 'Resolved').length;
}

function getVisibleIssues() {
  return state.issues
    .filter((issue) => {
      const matchesStatus = state.statusFilter === 'all' || issue.status === state.statusFilter;
      const searchableText = `${issue.title} ${issue.description} ${issue.assignee}`.toLowerCase();
      const matchesSearch = searchableText.includes(state.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const priorityDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function renderIssues() {
  const visibleIssues = getVisibleIssues();

  if (!visibleIssues.length) {
    issueList.innerHTML = '<li class="empty-state">No issues match your current filters.</li>';
    return;
  }

  issueList.innerHTML = visibleIssues
    .map((issue) => {
      const priorityClass = issue.priority.toLowerCase();
      const statusClass = getStatusClass(issue.status);
      const nextStatusLabel = nextStatus(issue.status);

      return `
        <li class="issue-item" data-id="${issue.id}">
          <div class="issue-topline">
            <div>
              <div class="issue-title">${escapeHtml(issue.title)}</div>
            </div>
            <span class="priority-badge ${priorityClass}">${escapeHtml(issue.priority)}</span>
          </div>

          <p class="issue-description">${escapeHtml(issue.description)}</p>

          <div class="issue-meta">
            <span class="meta-pill">Owner: ${escapeHtml(issue.assignee)}</span>
            <span class="meta-pill">Due: ${formatDate(issue.dueDate)}</span>
            <span class="meta-pill status-pill ${statusClass}">${escapeHtml(issue.status)}</span>
          </div>

          <div class="issue-actions">
            <button type="button" class="advance-btn" data-action="advance" data-id="${issue.id}">
              Move to ${nextStatusLabel}
            </button>
            <button type="button" class="delete-btn" data-action="delete" data-id="${issue.id}">
              Delete
            </button>
          </div>
        </li>
      `;
    })
    .join('');
}

function render() {
  updateStats();
  renderIssues();
}

function addIssue(event) {
  event.preventDefault();

  const formData = new FormData(issueForm);
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const assignee = String(formData.get('assignee') || '').trim();
  const priority = String(formData.get('priority') || 'Medium');
  const status = String(formData.get('status') || 'Open');
  const dueDate = String(formData.get('dueDate') || '');

  if (!title || !description || !assignee) {
    window.alert('Please provide a title, description, and assignee before submitting.');
    return;
  }

  const issue = {
    id: `issue-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    description,
    assignee,
    priority,
    status,
    dueDate,
    createdAt: new Date().toISOString()
  };

  state.issues.unshift(issue);
  saveIssues();
  issueForm.reset();
  const prioritySelect = document.getElementById('issue-priority');
  if (prioritySelect) prioritySelect.value = 'Medium';
  const statusSelect = document.getElementById('issue-status');
  if (statusSelect) statusSelect.value = 'Open';
  render();
}

function handleIssueAction(event) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;

  const { action, id } = trigger.dataset;
  const targetIssue = state.issues.find((issue) => issue.id === id);
  if (!targetIssue) return;

  if (action === 'advance') {
    targetIssue.status = nextStatus(targetIssue.status);
    saveIssues();
    render();
    return;
  }

  if (action === 'delete') {
    state.issues = state.issues.filter((issue) => issue.id !== id);
    saveIssues();
    render();
  }
}

function resetDemoData() {
  state.issues = [...demoIssues];
  saveIssues();
  render();
}

function bindEvents() {
  issueForm.addEventListener('submit', addIssue);
  issueList.addEventListener('click', handleIssueAction);
  searchInput.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    renderIssues();
  });
  statusFilter.addEventListener('change', (event) => {
    state.statusFilter = event.target.value;
    renderIssues();
  });
  resetDemoButton.addEventListener('click', resetDemoData);
}

function initialize() {
  state.issues = loadIssues();
  bindEvents();
  render();
}

initialize();
