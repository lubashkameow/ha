document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    
    // Инициализация Telegram Web App
    tg.expand();
    tg.enableClosingConfirmation();
    tg.BackButton.show();
    tg.BackButton.onClick(() => tg.close());
    
    // Запрет масштабирования
    disableZoom();
    
    // Загрузка данных пользователя
    initUserData();
    
    // Загрузка услуг
    loadServices();
    
    // Обработчик кнопки записи
    document.getElementById('book-btn').addEventListener('click', () => {
        tg.showPopup({
            title: 'Запись',
            message: 'Для записи воспользуйтесь кнопкой "Открыть запись"',
            buttons: [{ type: 'ok' }]
        });
    });
});

// Функция для запрета масштабирования
function disableZoom() {
    const viewport = document.querySelector('meta[name="viewport"]');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    
    document.addEventListener('touchmove', function(e) {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });
}

// Инициализация данных пользователя
function initUserData() {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe.user;
    
    if (user) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.first_name || user.username || 'Гость';
        }
        
        if (user.photo_url) {
            const avatarElement = document.getElementById('user-avatar');
            if (avatarElement) {
                avatarElement.src = user.photo_url;
            }
        }
    }
}

// Загрузка услуг с сервера
async function loadServices() {
    const container = document.getElementById('services-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loader">Загрузка услуг...</div>';
    
    try {
        const response = await fetch('/.netlify/functions/getservices');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        renderServices(data);
        
    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        container.innerHTML = '<p class="error">Не удалось загрузить услуги. Пожалуйста, попробуйте позже.</p>';
    }
}

// Рендер услуг
function renderServices(data) {
    const container = document.getElementById('services-container');
    if (!container || !data.catalog) return;
    
    // Создаем кнопки для переключения категорий
    let html = `
        <div class="gender-switcher">
            ${data.categories.map(cat => `
                <button class="gender-btn" data-category="${cat.id}">${cat.name}</button>
            `).join('')}
        </div>
    `;
    
    // Добавляем контейнер для каталогов
    html += '<div id="gender-catalogs"></div>';
    
    container.innerHTML = html;
    
    // Рендерим первый каталог по умолчанию
    if (data.categories.length > 0) {
        renderCatalog(data.categories[0].id, data.catalog);
    }
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const categoryId = btn.getAttribute('data-category');
            renderCatalog(categoryId, data.catalog);
            
            // Обновляем активную кнопку
            document.querySelectorAll('.gender-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
        });
    });
    
    // Активируем первую кнопку
    if (document.querySelector('.gender-btn')) {
        document.querySelector('.gender-btn').classList.add('active');
    }
}

// Рендер конкретного каталога
function renderCatalog(categoryId, catalog) {
    const container = document.getElementById('gender-catalogs');
    if (!container) return;
    
    // Находим название категории по ID
    let categoryName = '';
    if (categoryId == 1) categoryName = 'Женский каталог';
    else if (categoryId == 2) categoryName = 'Мужской каталог';
    
    let html = `<div class="gender-catalog" data-category="${categoryId}">`;
    html += `<h2 class="gender-title">${categoryName}</h2>`;
    
    // Находим соответствующие услуги
    const services = catalog[categoryName];
    if (services) {
        for (const [length, items] of Object.entries(services)) {
            html += `<div class="category-title">${length}</div>`;
            html += '<div class="services-list">';
            
            items.forEach(item => {
                html += `
                    <div class="service-item">
                        <span class="service-bullet">✦</span>
                        <span class="service-name">${item.name}</span>
                        <span class="service-price">${item.price}</span>
                    </div>
                `;
            });
            
            html += '</div>';
        }
    } else {
        html += '<p>Услуги для этой категории не найдены</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}
