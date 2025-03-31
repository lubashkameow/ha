document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    
    // Инициализация Telegram Web App
    tg.expand();
    tg.BackButton.show();
    tg.BackButton.onClick(() => tg.close());
    
    // Загрузка данных пользователя
    const user = tg.initDataUnsafe.user;
    if (user) {
        document.getElementById('user-name').textContent = 
            user.first_name || user.username || 'Гость';
        
        if (user.photo_url) {
            document.getElementById('user-avatar').src = user.photo_url;
        }
    }
    
    // Загрузка услуг
    loadServices();
    
    // Обработчик кнопки записи
    document.getElementById('book-btn').addEventListener('click', () => {
        tg.showPopup({
            title: 'Запись',
            message: 'Выберите услугу из каталога',
            buttons: [{ id: 'ok', type: 'ok' }]
        });
    });
});

async function loadServices() {
    const container = document.getElementById('services-container');
    container.innerHTML = '<div class="loader">Загрузка услуг...</div>';
    
    try {
        const response = await fetch('/.netlify/functions/getservices');
        const services = await response.json();
        
        // Группировка по полу и категориям
        const catalogData = {
            female: {},
            male: {}
        };
        
        services.forEach(service => {
            const gender = service.gender === 'female' ? 'female' : 'male';
            if (!catalogData[gender][service.name_category]) {
                catalogData[gender][service.name_category] = [];
            }
            catalogData[gender][service.name_category].push(service);
        });
        
        // Создание HTML
        renderCatalog(catalogData);
        
        // Инициализация кнопок переключения
        initGenderButtons();
        
    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = '<p class="error">Не удалось загрузить услуги</p>';
    }
}

function renderCatalog(data) {
    const container = document.getElementById('services-container');
    
    // Основной HTML
    container.innerHTML = `
        <div class="gender-buttons">
            <button class="gender-btn active" data-gender="female">Женский каталог</button>
            <button class="gender-btn" data-gender="male">Мужской каталог</button>
        </div>
        
        <div id="female-catalog" class="gender-catalog">
            ${renderGenderCatalog(data.female)}
        </div>
        
        <div id="male-catalog" class="gender-catalog" style="display:none">
            ${renderGenderCatalog(data.male)}
        </div>
    `;
}

function renderGenderCatalog(genderData) {
    return Object.entries(genderData).map(([category, services]) => `
        <div class="category-section">
            <h3 class="category-title">${category}</h3>
            <div class="services-grid">
                ${services.map(service => `
                    <div class="service-card">
                        <h4>${service.name_service}</h4>
                        <p class="service-price">${service.price} ₽</p>
                        <button class="service-btn" data-service-id="${service.id_service}">
                            Выбрать
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function initGenderButtons() {
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Переключение активной кнопки
            document.querySelectorAll('.gender-btn').forEach(b => 
                b.classList.remove('active')
            );
            btn.classList.add('active');
            
            // Переключение каталогов
            document.querySelectorAll('.gender-catalog').forEach(catalog => 
                catalog.style.display = 'none'
            );
            document.getElementById(`${btn.dataset.gender}-catalog`).style.display = 'block';
        });
    });
    
    // Обработчики для кнопок выбора услуги
    document.querySelectorAll('.service-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceId = btn.dataset.serviceId;
            // Здесь можно добавить логику записи
            window.Telegram.WebApp.showAlert(`Выбрана услуга #${serviceId}`);
        });
    });
}
