// Инициализация структуры данных в localStorage
let state = {
    products: JSON.parse(localStorage.getItem('prime_moto_products')) || [
        { id: 1, name: 'Ремень вариатора Maxi 125cc', buyPrice: 450, sellPrice: 850, stock: 6 },
        { id: 2, name: 'Ролики вариатора Samurai 150g', buyPrice: 180, sellPrice: 350, stock: 12 },
        { id: 3, name: 'Тормозные колодки M8 передние', buyPrice: 220, sellPrice: 450, stock: 4 },
        { id: 4, name: 'Фильтр воздушный Tank / Q Max', buyPrice: 150, sellPrice: 300, stock: 8 }
    ],
    salesHistory: JSON.parse(localStorage.getItem('prime_moto_sales')) || []
};

function saveState() {
    localStorage.setItem('prime_moto_products', JSON.stringify(state.products));
    localStorage.setItem('prime_moto_sales', JSON.stringify(state.salesHistory));
}

// Навигация по табам
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(button.dataset.target).classList.add('active');
        
        if (button.dataset.target === 'tab-reports') {
            updateReports();
        }
    });
});

// Рендер каталога продаж (POS)
function renderPOS(filter = '') {
    const container = document.getElementById('posProductList');
    container.innerHTML = '';
    
    const filtered = state.products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding: 20px;">Товары не найдены</p>';
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'pos-card';
        card.innerHTML = `
            <div class="pos-card-info">
                <h4>${product.name}</h4>
                <div class="price">${product.sellPrice} сом</div>
                <div class="stock">В наличии: ${product.stock} шт.</div>
            </div>
            <button class="btn-sell" onclick="makeSale(${product.id})" ${product.stock <= 0 ? 'disabled style="opacity:0.3"' : ''}>➕</button>
        `;
        container.appendChild(card);
    });
}

// Рендер склада
function renderInventory(filter = '') {
    const container = document.getElementById('inventoryList');
    container.innerHTML = '';

    const filtered = state.products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'inv-card';
        card.innerHTML = `
            <div class="inv-card-details">
                <h4>${product.name}</h4>
                <p>Закуп: ${product.buyPrice} | Прод: ${product.sellPrice} | Остаток: <strong>${product.stock}</strong></p>
            </div>
            <div class="inv-actions">
                <button class="btn-outline" onclick="openEditModal(${product.id})">✏️</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">🗑️</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Продажа товара (Кнопка ➕)
function makeSale(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    product.stock -= 1;

    const saleRecord = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.salesHistory.unshift(saleRecord);
    saveState();
    
    renderPOS(document.getElementById('posSearch').value);
    updateCancelButtonState();
    showToast(`Продано: ${product.name}`);
}

// Отмена последней продажи
document.getElementById('cancelLastSaleBtn').addEventListener('click', () => {
    if (state.salesHistory.length === 0) return;

    const lastSale = state.salesHistory.shift();
    const product = state.products.find(p => p.id === lastSale.productId);
    
    if (product) {
        product.stock += 1;
    }

    saveState();
    renderPOS(document.getElementById('posSearch').value);
    updateCancelButtonState();
    showToast('Последняя продажа отменена');
});

function updateCancelButtonState() {
    const btn = document.getElementById('cancelLastSaleBtn');
    btn.disabled = state.salesHistory.length === 0;
}

// Закрыть день (сбросить историю текущей смены)
document.getElementById('closeDayBtn').addEventListener('click', () => {
    if (confirm('Закрыть день и сбросить текущую историю продаж?')) {
        state.salesHistory = [];
        saveState();
        updateReports();
        updateCancelButtonState();
        alert('День успешно закрыт!');
    }
});

// Отчеты и расчеты
function updateReports() {
    let revenue = 0;
    let cost = 0;

    state.salesHistory.forEach(sale => {
        revenue += sale.sellPrice;
        cost += sale.buyPrice;
    });

    const profit = revenue - cost;

    document.getElementById('statRevenue').innerText = `${revenue} сом`;
    document.getElementById('statCost').innerText = `${cost} сом`;
    document.getElementById('statProfit').innerText = `${profit} сом`;

    const historyContainer = document.getElementById('salesHistoryList');
    historyContainer.innerHTML = '';

    if (state.salesHistory.length === 0) {
        historyContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Сегодня продаж еще не было</p>';
        return;
    }

    state.salesHistory.forEach(sale => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <strong>${sale.name}</strong>
                <div class="time">${sale.timestamp}</div>
            </div>
            <div style="color: var(--accent-green); font-weight: bold;">+${sale.sellPrice} сом</div>
        `;
        historyContainer.appendChild(item);
    });
}

// Модальное окно управления товаром
const modal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');

document.getElementById('openAddModalBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').innerText = 'Новый товар';
    document.getElementById('productId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodBuyPrice').value = '';
    document.getElementById('prodSellPrice').value = '';
    document.getElementById('prodStock').value = '1';
    modal.classList.add('open');
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    modal.classList.remove('open');
});

function openEditModal(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalTitle').innerText = 'Редактировать товар';
    document.getElementById('productId').value = product.id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodBuyPrice').value = product.buyPrice;
    document.getElementById('prodSellPrice').value = product.sellPrice;
    document.getElementById('prodStock').value = product.stock;
    modal.classList.add('open');
}

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const name = document.getElementById('prodName').value;
    const buyPrice = Number(document.getElementById('prodBuyPrice').value);
    const sellPrice = Number(document.getElementById('prodSellPrice').value);
    const stock = Number(document.getElementById('prodStock').value);

    if (id) {
        // Редактирование
        const product = state.products.find(p => p.id == id);
        if (product) {
            product.name = name;
            product.buyPrice = buyPrice;
            product.sellPrice = sellPrice;
            product.stock = stock;
        }
    } else {
        // Добавление
        const newProduct = {
            id: Date.now(),
            name,
            buyPrice,
            sellPrice,
            stock
        };
        state.products.push(newProduct);
    }

    saveState();
    modal.classList.remove('open');
    renderPOS(document.getElementById('posSearch').value);
    renderInventory(document.getElementById('invSearch').value);
});

function deleteProduct(id) {
    if (confirm('Удалить этот товар со склада?')) {
        state.products = state.products.filter(p => p.id !== id);
        saveState();
        renderInventory(document.getElementById('invSearch').value);
        renderPOS(document.getElementById('posSearch').value);
    }
}

// Поиск в реальном времени
document.getElementById('posSearch').addEventListener('input', (e) => {
    renderPOS(e.target.value);
});

document.getElementById('invSearch').addEventListener('input', (e) => {
    renderInventory(e.target.value);
});

// Вспомогательный тост уведомление
function showToast(text) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: #00ff66; color: #000; padding: 8px 16px; border-radius: 20px;
        font-weight: bold; font-size: 13px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,255,102,0.3);
    `;
    toast.innerText = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
}

// Первичный запуск
renderPOS();
renderInventory();
updateCancelButtonState();
