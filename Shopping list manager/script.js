const STORAGE_KEY = 'shoppingManagerLists';
const THEME_KEY = 'shoppingManagerTheme';

const itemForm = document.getElementById('itemForm');
const itemNameInput = document.getElementById('itemName');
const itemCategoryInput = document.getElementById('itemCategory');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemCostInput = document.getElementById('itemCost');
const listSelector = document.getElementById('listSelector');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sortCategory = document.getElementById('sortCategory');
const itemList = document.getElementById('itemList');
const activeListName = document.getElementById('activeListName');
const statTotalItems = document.getElementById('statTotalItems');
const statPurchased = document.getElementById('statPurchased');
const statPending = document.getElementById('statPending');
const statTotalCost = document.getElementById('statTotalCost');
const budgetInput = document.getElementById('budgetInput');
const budgetSaveBtn = document.getElementById('budgetSaveBtn');
const budgetAmount = document.getElementById('budgetAmount');
const estimatedCost = document.getElementById('estimatedCost');
const remainingBudget = document.getElementById('remainingBudget');
const budgetProgress = document.getElementById('budgetProgress');
const budgetAlert = document.getElementById('budgetAlert');
const insightList = document.getElementById('insightList');
const themeToggle = document.getElementById('themeToggle');
const newListBtn = document.getElementById('newListBtn');
const saveListBtn = document.getElementById('saveListBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const newListName = document.getElementById('newListName');
const cancelNewList = document.getElementById('cancelNewList');
const confirmNewList = document.getElementById('confirmNewList');

let lists = [];
let currentListId = null;
let filterState = 'all';
let searchTerm = '';
let sortOption = 'none';

function createId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDefaultLists() {
  return [
    {
      id: createId(),
      name: 'Weekly Groceries',
      budget: 3000,
      items: [
        { id: createId(), name: 'Greek yogurt', category: 'Dairy', quantity: 2, cost: 180, purchased: false },
        { id: createId(), name: 'Bananas', category: 'Produce', quantity: 6, cost: 90, purchased: true },
        { id: createId(), name: 'Bread loaf', category: 'Bakery', quantity: 1, cost: 55, purchased: false },
        { id: createId(), name: 'Orange juice', category: 'Beverages', quantity: 2, cost: 240, purchased: false },
      ],
    },
  ];
}

function loadLists() {
  const stored = localStorage.getItem(STORAGE_KEY);
  lists = stored ? JSON.parse(stored) : getDefaultLists();
  if (!lists || !lists.length) {
    lists = getDefaultLists();
  }
  currentListId = lists[0].id;
  renderListSelector();
  updateUI();
}

function saveLists() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

function getCurrentList() {
  return lists.find((list) => list.id === currentListId) || lists[0];
}

function updateUI() {
  const list = getCurrentList();
  if (!list) return;
  activeListName.textContent = list.name;
  budgetInput.value = list.budget ?? 0;
  renderItems();
  updateStats();
  updateBudgetTracker();
  generateInsights();
}

function renderListSelector() {
  listSelector.innerHTML = '';
  lists.forEach((list) => {
    const option = document.createElement('option');
    option.value = list.id;
    option.textContent = list.name;
    listSelector.appendChild(option);
  });
  listSelector.value = currentListId;
}

function renderItems() {
  const list = getCurrentList();
  if (!list) return;
  const filteredItems = list.items
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterState === 'all'
        || (filterState === 'purchased' && item.purchased)
        || (filterState === 'pending' && !item.purchased);
      return matchesSearch && statusMatch;
    })
    .sort((a, b) => {
      if (sortOption === 'none') return 0;
      if (a.category === sortOption && b.category !== sortOption) return -1;
      if (b.category === sortOption && a.category !== sortOption) return 1;
      return a.name.localeCompare(b.name);
    });

  itemList.innerHTML = filteredItems.length
    ? filteredItems.map(createItemCard).join('')
    : '<div class="item-card"><p class="item-title">No matching items found.</p></div>';
}

function createItemCard(item) {
  const purchasedClass = item.purchased ? 'purchased' : '';
  const costValue = item.cost * item.quantity;
  return `
    <div class="item-card">
      <label class="item-meta">
        <p class="item-title ${purchasedClass}">${item.name}</p>
        <div class="item-details">
          <span class="badge ${item.category}">${item.category}</span>
          <span>${item.quantity} pcs</span>
          <span>₹${costValue.toFixed(2)}</span>
        </div>
      </label>
      <div class="action-buttons">
        <button class="small-btn" onclick="togglePurchased('${item.id}')">
          ${item.purchased ? 'Mark Pending' : 'Mark Purchased'}
        </button>
        <button class="small-btn" onclick="removeItem('${item.id}')">Remove</button>
      </div>
    </div>
  `;
}

function addItem(event) {
  event.preventDefault();
  const name = itemNameInput.value.trim();
  const category = itemCategoryInput.value;
  const quantity = Number(itemQuantityInput.value) || 1;
  const cost = Number(itemCostInput.value) || 0;
  if (!name) return;

  const list = getCurrentList();
  list.items.unshift({
    id: createId(),
    name,
    category,
    quantity,
    cost,
    purchased: false,
  });

  itemForm.reset();
  itemQuantityInput.value = 1;
  itemCostInput.value = 0;
  saveLists();
  updateUI();
}

function removeItem(itemId) {
  const list = getCurrentList();
  list.items = list.items.filter((item) => item.id !== itemId);
  saveLists();
  updateUI();
}

function togglePurchased(itemId) {
  const list = getCurrentList();
  const item = list.items.find((item) => item.id === itemId);
  if (!item) return;
  item.purchased = !item.purchased;
  saveLists();
  updateUI();
}

function updateStats() {
  const list = getCurrentList();
  const totalItems = list.items.length;
  const purchasedCount = list.items.filter((item) => item.purchased).length;
  const pendingCount = totalItems - purchasedCount;
  const totalCostValue = list.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);

  statTotalItems.textContent = totalItems;
  statPurchased.textContent = purchasedCount;
  statPending.textContent = pendingCount;
  statTotalCost.textContent = `₹${totalCostValue.toFixed(2)}`;
}

function setBudget() {
  const list = getCurrentList();
  const budgetValue = Number(budgetInput.value) || 0;
  list.budget = budgetValue;
  saveLists();
  updateBudgetTracker();
  generateInsights();
}

function updateBudgetTracker() {
  const list = getCurrentList();
  const total = list.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const budgetValue = list.budget || 0;
  const remaining = budgetValue - total;
  const progress = budgetValue > 0 ? Math.min((total / budgetValue) * 100, 100) : 0;
  const widthValue = `${progress}%`;

  budgetAmount.textContent = `₹${budgetValue.toFixed(2)}`;
  estimatedCost.textContent = `₹${total.toFixed(2)}`;
  remainingBudget.textContent = `₹${remaining.toFixed(2)}`;
  budgetProgress.style.width = widthValue;

  const exceeded = total > budgetValue && budgetValue > 0;
  budgetAlert.textContent = exceeded ? 'Budget exceeded! Review pending items.' : 'Budget status is optimal.';
  budgetAlert.style.color = exceeded ? 'var(--warning)' : 'var(--success)';
}

function generateInsights() {
  const list = getCurrentList();
  const totalItems = list.items.length;
  const purchased = list.items.filter((item) => item.purchased);
  const pending = list.items.filter((item) => !item.purchased);
  const budgetValue = list.budget || 0;
  const totalCost = list.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);

  const categoryCounts = list.items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  const insights = [
    `${pending.length} item${pending.length === 1 ? '' : 's'} are still pending`,
    purchased.length ? `${purchased.length} item${purchased.length === 1 ? '' : 's'} completed` : 'No items have been purchased yet',
    topCategory ? `Most items are from ${topCategory[0]} category` : 'Add items to see category insights',
    budgetValue > 0
      ? totalCost > budgetValue
        ? 'Budget usage is exceeded — trim your list to stay on track.'
        : 'Your budget usage is optimal.'
      : 'Set a budget to receive spending insights.',
    pending.length ? 'Complete your pending purchases to finish the list.' : 'All purchases completed — great job!',
  ];

  insightList.innerHTML = insights.map((insight) => `
    <div class="insight-item">${insight}</div>
  `).join('');
}

function searchItems(event) {
  searchTerm = event.target.value;
  renderItems();
}

function filterItems(event) {
  filterState = event.target.value;
  renderItems();
}

function sortItems(event) {
  sortOption = event.target.value;
  renderItems();
}

function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  const active = body.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, active);
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function showNewListModal() {
  modalBackdrop.classList.remove('hidden');
  newListName.value = '';
  newListName.focus();
}

function hideNewListModal() {
  modalBackdrop.classList.add('hidden');
}

function createNewList() {
  const name = newListName.value.trim();
  if (!name) return;
  const newList = {
    id: createId(),
    name,
    budget: 0,
    items: [],
  };
  lists.unshift(newList);
  currentListId = newList.id;
  saveLists();
  renderListSelector();
  updateUI();
  hideNewListModal();
}

function switchList(event) {
  currentListId = event.target.value;
  updateUI();
}

function saveCurrentListName() {
  const list = getCurrentList();
  if (!list) return;
  saveLists();
  renderListSelector();
}

window.togglePurchased = togglePurchased;
window.removeItem = removeItem;

function initializeEvents() {
  itemForm.addEventListener('submit', addItem);
  searchInput.addEventListener('input', searchItems);
  statusFilter.addEventListener('change', filterItems);
  sortCategory.addEventListener('change', sortItems);
  themeToggle.addEventListener('click', toggleDarkMode);
  budgetSaveBtn.addEventListener('click', setBudget);
  listSelector.addEventListener('change', switchList);
  newListBtn.addEventListener('click', showNewListModal);
  cancelNewList.addEventListener('click', hideNewListModal);
  confirmNewList.addEventListener('click', createNewList);
  saveListBtn.addEventListener('click', saveCurrentListName);
  modalBackdrop.addEventListener('click', (event) => {
    if (event.target === modalBackdrop) hideNewListModal();
  });
}

loadTheme();
initializeEvents();
loadLists();
