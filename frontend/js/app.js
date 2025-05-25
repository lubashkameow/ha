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
    
    // Загрузка услуг (только для просмотра)
    loadServicesForView();
    
    // Обработчик кнопки записи
    document.getElementById('book-btn').addEventListener('click', () => {
        showBookingForm();
    });

    checkIfUserIsMaster();



});

let selectedDate = null;
let selectedService = null;
let selectedSlot = null;
let selectedMaster = null;
let isCurrentUserMaster = false;
let currentWeekStart = new Date();

// Блокировка масштабирования
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
// Проверка, является ли пользователь мастером
async function checkIfUserIsMaster() {
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user?.id;
    if (!userId) return;

    try {
        const response = await fetch(`/.netlify/functions/ismaster?user_id=${userId}`);
        const data = await response.json();

        if (data.is_master) {
            isCurrentUserMaster = true;
            addReportsNavItem();
            document.getElementById('edit-portfolio-btn').style.display = 'block';
            document.getElementById('edit-calendar-btn').style.display = 'block';
            document.getElementById('master-prev-week').style.display = 'block';
            document.getElementById('master-next-week').style.display = 'block';
            initPortfolioEditModal();
        } else {
            isCurrentUserMaster = false;
            document.getElementById('edit-portfolio-btn').style.display = 'none';
            document.getElementById('edit-calendar-btn').style.display = 'none';
            document.getElementById('master-prev-week').style.display = 'none';
            document.getElementById('master-next-week').style.display = 'none';
        }
    } catch (error) {
        console.error('Ошибка при проверке мастера:', error);
        isCurrentUserMaster = false;
        document.getElementById('edit-portfolio-btn').style.display = 'none';
        document.getElementById('edit-calendar-btn').style.display = 'none';
        document.getElementById('master-prev-week').style.display = 'none';
        document.getElementById('master-next-week').style.display = 'none';
    }
}

async function loadReport(type) {
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user?.id;
    const month = document.getElementById('report-month').value;

    if (!userId) {
        console.error('Ошибка: user_id не найден');
        document.getElementById('report-result').innerHTML = '<p class="error">Ошибка: пользователь не авторизован</p>';
        return;
    }

    if (!month) {
        console.error('Ошибка: месяц не выбран');
        document.getElementById('report-result').innerHTML = '<p class="error">Ошибка: выберите месяц</p>';
        return;
    }

    console.log(`Loading report: type=${type}, user_id=${userId}, month=${month}`);

    try {
        const response = await fetch(`/.netlify/functions/getreport?user_id=${userId}&month=${month}&type=${type}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Report error:', data);
            document.getElementById('report-result').innerHTML = `<p class="error">Ошибка: ${data.error || 'Не удалось загрузить отчет'}</p>`;
            return;
        }

        const container = document.getElementById('report-result');
        container.innerHTML = renderReportTable(data, type);
    } catch (error) {
        console.error('Ошибка загрузки отчета:', error);
        document.getElementById('report-result').innerHTML = '<p class="error">Ошибка загрузки отчета</p>';
    }
}

function renderReportTable(data, type) {
    if (!data || !data.summary) {
        return '<p>Нет данных для отчета.</p>';
    }

    const headersMap = {
        materials: {
            name_material: 'Материал',
            quantity_ml: 'Объем (мл)',
            quantity: 'Количество',
            cost: 'Стоимость (₽)'
        }
    };

    let html = '';

    // Summary section
    html += '<div class="report-summary">';
    if (type === 'clients') {
        html += `<p>Всего клиентов: ${data.summary.total_clients}</p>`;
        html += `<p>Новых клиентов: ${data.summary.new_clients}</p>`;
    } else if (type === 'appointments') {
        html += `<p>Выполнено услуг: ${data.summary.completed_services}</p>`;
        html += `<p>Популярность услуг:</p><ul>`;
        data.summary.service_popularity.forEach(s => {
            html += `<li>${s.name_service} (${s.name_length}): ${s.count}</li>`;
        });
        html += `</ul>`;
        html += `<p>Предстоящие записи: ${data.summary.upcoming}</p>`;
    } else if (type === 'materials') {
        html += `<p>Текущий расход: ${data.summary.total_cost} ₽</p>`;
        html += `<p>Расход на предстоящие услуги: ${data.summary.upcoming_cost} ₽</p>`;
        html += `<p>Ожидаемый расход: ${data.summary.expected_cost} ₽</p>`;
    } else if (type === 'profit') {
        html += `<p>Выручка: ${data.summary.total_revenue} ₽</p>`;
        html += `<p>Расход на материалы: ${data.summary.total_material_cost} ₽</p>`;
        html += `<p>Примерная прибыль: ${data.summary.profit} ₽</p>`;
        html += `<p>Ожидаемая прибыль: ${data.summary.expected_profit} ₽</p>`;
    }
    html += '</div>';

    // Tables only for materials
    if (type === 'materials') {
        // Data table (выполненные услуги)
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const headers = headersMap[type];
            html += '<h4>Расход материалов (выполненные услуги)</h4>';
            html += '<table class="report-table"><thead><tr>';
            Object.values(headers).forEach(h => html += `<th>${h}</th>`);
            html += '</tr></thead><tbody>';

            data.data.forEach(row => {
                html += '<tr>';
                Object.keys(headers).forEach(key => {
                    let value = row[key] || '';
                    if (key === 'cost') value = `${value} ₽`;
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
        } else {
            html += '<p>Нет данных о расходе материалов для выполненных услуг.</p>';
        }

        // Upcoming data table (предстоящие услуги)
        if (data.upcoming_data && Array.isArray(data.upcoming_data) && data.upcoming_data.length > 0) {
            const headers = headersMap[type];
            html += '<h4>Расход материалов (предстоящие услуги)</h4>';
            html += '<table class="report-table"><thead><tr>';
            Object.values(headers).forEach(h => html += `<th>${h}</th>`);
            html += '</tr></thead><tbody>';

            data.upcoming_data.forEach(row => {
                html += '<tr>';
                Object.keys(headers).forEach(key => {
                    let value = row[key] || '';
                    if (key === 'cost') value = `${value} ₽`;
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
        } else {
            html += '<p>Нет данных о расходе материалов для предстоящих услуг.</p>';
        }
    }

    return html;
}



function addReportsNavItem() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const reportsItem = document.createElement('div');
    reportsItem.className = 'nav-item';
    reportsItem.setAttribute('data-page', 'reports');
    reportsItem.innerHTML = `
        <i>📊</i>
        <span>Отчеты</span>
    `;
    nav.appendChild(reportsItem);

    reportsItem.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        this.classList.add('active');

        let page = document.getElementById('page-reports');
        if (!page) {
            page = document.createElement('div');
            page.id = 'page-reports';
            page.className = 'page active';
            page.innerHTML = `
                <h3>Отчеты</h3>
                <label for="report-month">Выберите месяц:</label>
                <input type="month" id="report-month" value="${new Date().toISOString().slice(0, 7)}" />
                <div class="report-buttons">
                    <button class="report-btn" onclick="loadReport('clients')">Отчет по клиентам</button>
                    <button class="report-btn" onclick="loadReport('appointments')">Отчет по записям</button>
                    <button class="report-btn" onclick="loadReport('materials')">Расход материалов</button>
                    <button class="report-btn" onclick="loadReport('profit')">Прибыль</button>
                </div>
                <div id="report-result" class="report-result"></div>
            `;
            document.querySelector('.main-content').appendChild(page);
        } else {
            page.classList.add('active');
        }
    });
}


function addReportsNavItem() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const reportsItem = document.createElement('div');
    reportsItem.className = 'nav-item';
    reportsItem.setAttribute('data-page', 'reports');
    reportsItem.innerHTML = `
        <i>📊</i>
        <span>Отчеты</span>
    `;
    nav.appendChild(reportsItem);

    reportsItem.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        this.classList.add('active');

        let page = document.getElementById('page-reports');
        if (!page) {
            page = document.createElement('div');
            page.id = 'page-reports';
            page.className = 'page active';
            page.innerHTML = `
                <h3>Отчеты</h3>
                <label for="report-month">Выберите месяц:</label>
                <input type="month" id="report-month" value="${new Date().toISOString().slice(0, 7)}" />
                <div class="report-buttons">
                    <button class="report-btn" onclick="loadReport('clients')">Отчет по клиентам</button>
                    <button class="report-btn" onclick="loadReport('appointments')">Отчет по записям</button>
                    <button class="report-btn" onclick="loadReport('materials')">Расход материалов</button>
                    <button class="report-btn" onclick="loadReport('profit')">Прибыль</button>
                </div>
                <div id="report-result" class="report-result"></div>
            `;
            document.querySelector('.main-content').appendChild(page);
        } else {
            page.classList.add('active');
        }
    });
}


// Загрузка услуг для просмотра
async function loadServicesForView() {
    const container = document.getElementById('services-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loader">Загрузка услуг...</div>';
    
    try {
        const response = await fetch('/.netlify/functions/getservices');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        renderServicesForView(data);

    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        container.innerHTML = '<p class="error">Не удалось загрузить услуги. Пожалуйста, попробуйте позже.</p>';
    }
}

// Отображение каталога услуг
function renderServicesForView(data) {
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


// Показать форму записи
function showBookingForm() {
    const formContainer = document.getElementById('booking-form-container');
    
    if (formContainer) {
        formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
        return;
    }
    
    const formHtml = `
<div id="booking-form-container" class="booking-form-container">
    <h3>${isCurrentUserMaster ? 'Создание новой записи' : 'Запись на услугу'}</h3>
    
    ${isCurrentUserMaster ? `
    <div class="form-step active" id="step-client-info">
        <label>Имя клиента:</label>
        <input type="text" id="client-name" class="form-control">
        <label>Телефон клиента:</label>
        <input type="tel" id="client-phone" class="form-control">
    </div>
    ` : ''}
    
    <div class="form-step active" id="step-catalog">
        <label>Выберите каталог:</label>
        <select id="catalog-select" class="form-control">
            <option value="">-- Выберите каталог --</option>
            <option value="1">Женский каталог</option>
            <option value="2">Мужской каталог</option>
        </select>
    </div>
    
    <div class="form-step" id="step-service" style="display:none;">
        <label>Выберите услугу:</label>
        <select id="service-select" class="form-control" disabled>
            <option value="">-- Сначала выберите каталог --</option>
        </select>
    </div>
    
    <div class="form-step" id="step-date" style="display:none;">
        <label>Выберите дату:</label>
        <div class="calendar-header">
            <button id="prev-week">&lt;</button>
            <div id="current-week-range"></div>
            <button id="next-week">&gt;</button>
        </div>
        <div class="week-days" id="week-days-container"></div>
    </div>

    <div class="form-step" id="step-masters" style="display:none;">
        <label>Доступные мастера:</label>
        <div id="masters-slots-container"></div>
    </div>
    
    <div class="form-step" id="step-comment" style="display:none;">
        <label>Комментарий (необязательно):</label>
        <textarea id="booking-comment" class="form-control" placeholder="Ваши пожелания..."></textarea>
    </div>
    
    <div class="form-step" id="step-confirmation" style="display:none;">
        <!-- Здесь будет сводка -->
    </div>
    
    <div class="form-navigation">
        <button id="prev-btn" class="nav-btn" disabled>Назад</button>
        <button id="next-btn" class="nav-btn">Далее</button>
    </div>
</div>
`;
    
    // Вставляем форму в подготовленный контейнер
    const placeholder = document.getElementById('booking-form-placeholder');
if (placeholder) {
    placeholder.innerHTML = formHtml;

    // Показать модалку
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    // Назначить обработчик на крестик
    const closeBtn = document.getElementById('close-booking-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            placeholder.innerHTML = ''; // очищаем форму при закрытии
        });
    }
}

    
    // Инициализация обработчиков формы
    initBookingForm();
}

// Инициализация формы записи
function initBookingForm() {
    let currentWeekStart = new Date();
    currentWeekStart.setHours(0, 0, 0, 0);
    const catalogSelect = document.getElementById('catalog-select');
    const serviceSelect = document.getElementById('service-select');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let currentStep = 1;
    const totalSteps = 5;
    
    // Обработчик выбора каталога
    catalogSelect.addEventListener('change', async function() {
        if (!this.value) {
            serviceSelect.innerHTML = '<option value="">-- Сначала выберите каталог --</option>';
            serviceSelect.disabled = true;
            return;
        }
        
        serviceSelect.innerHTML = '<option value="">Загрузка услуг...</option>';
        serviceSelect.disabled = true;
        
        try {
            const response = await fetch(`/.netlify/functions/getservices?category_id=${this.value}`);
            const data = await response.json();
            
            serviceSelect.innerHTML = '<option value="">-- Выберите услугу --</option>';
            
            const catalogName = this.value === '1' ? 'Женский каталог' : 'Мужской каталог';
            const services = data.catalog[catalogName];
            
            for (const [subcategory, items] of Object.entries(services)) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = subcategory;
                
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = JSON.stringify({
                        id: item.id_service,
                        name: item.name,
                        price: item.price,
                        duration: item.duration_minutes,
                        name_length: subcategory
                    });
                    option.textContent = `${item.name} (${item.price})`;
                    optgroup.appendChild(option);
                });
                
                serviceSelect.appendChild(optgroup);
            }
            
            serviceSelect.disabled = false;
        } catch (error) {
            console.error('Ошибка загрузки услуг:', error);
            serviceSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    });
    serviceSelect.addEventListener('change', function() {
    try {
        if (this.value && this.value !== '""') { // Проверка на пустое значение
            selectedService = JSON.parse(this.value);
            console.log('Parsed service:', selectedService);
            
            // Проверка структуры
            if (!selectedService.id || !selectedService.name || !selectedService.name_length) {
                console.error('Invalid service structure:', selectedService);
                selectedService = null;
            }
        } else {
            selectedService = null;
        }
    } catch (e) {
        console.error('JSON parse error:', e);
        console.error('Failed to parse:', this.value);
        selectedService = null;
    }
});
    // Обработчик кнопки "Далее"
    nextBtn.addEventListener('click', async function() {
    if (currentStep === totalSteps) {
            await confirmBooking();
            return;
        }
    if (!validateCurrentStep()) return;

    // Перед переходом на следующий шаг
    if (currentStep === 2) { // При переходе от выбора услуги к выбору даты
        if (!serviceSelect.value) {
            alert('Пожалуйста, выберите услугу');
            return;
        }
        
        try {
            selectedService = JSON.parse(serviceSelect.value);
            console.log('Service selected for calendar:', selectedService);
            
            if (!selectedService || !selectedService.id) {
                throw new Error('Не удалось получить данные услуги');
            }
        } catch (e) {
            console.error('Error parsing service:', e);
            alert('Ошибка при выборе услуги');
            return;
        }
    }
    // Специальная обработка перехода от даты к мастерам
    if (currentStep === 3) {
         if (!selectedDate) {
             alert('Пожалуйста, выберите дату');
             return;
            }
        }
        
    currentStep++;
    updateFormView();

    if (currentStep === 3) {
        loadAvailableDates(selectedService);
    }
});
    
    // Обработчик кнопки "Назад"
    prevBtn.addEventListener('click', function() {
        if (currentStep <= 1) return;
        
        currentStep--;
        updateFormView();
    });
    
    // Валидация текущего шага
    function validateCurrentStep() {
        switch(currentStep) {
            case 1: // Каталог
                if (!catalogSelect.value) {
                    alert('Пожалуйста, выберите каталог');
                    return false;
                }
                return true;
                
            case 2: // Услуга
                if (!serviceSelect.value) {
                    alert('Пожалуйста, выберите услугу');
                    return false;
                }
                return true;
                
            case 3: // Дата
            // Изменили проверку - теперь смотрим на глобальную переменную selectedDate
            if (!selectedDate) {
                alert('Пожалуйста, выберите дату');
                return false;
            }
            return true;
            
            case 4: // Время и мастер
            if (!selectedSlot || !selectedMaster) {
                alert('Пожалуйста, выберите время и мастера');
                return false;
            }
            return true;
            
        default:
            return true;
    }
}
    
    // Обновление отображения формы
    function updateFormView() {
        // Скрываем все шаги
        document.querySelectorAll('.form-step').forEach(step => {
            step.style.display = 'none';
        });
        
        // Показываем текущий шаг
        document.getElementById(`step-${getStepName(currentStep)}`).style.display = 'block';
        
        // Обновляем кнопки навигации
        prevBtn.disabled = currentStep === 1;
        nextBtn.textContent = currentStep === totalSteps ? 'Подтвердить' : 'Далее';

        // Если это шаг подтверждения (5), показываем сводку
    if (currentStep === 5) {
        showConfirmationSummary();
    }
}
    
    // Получение имени шага
    function getStepName(step) {
    switch(step) {
        case 1: return 'catalog';
        case 2: return 'service';
        case 3: return 'date';
        case 4: return 'comment';
        case 5: return 'confirmation';
        default: return '';
    }
}
    
    // Загрузка доступных дат
    async function loadAvailableDates(service) {
    const container = document.getElementById('week-days-container'); 
    container.innerHTML = '<div class="loader">Загрузка дат...</div>';
    
    try {
        console.log('Service ID:', service.id);
        
        if (!service.id) {
            throw new Error('Service ID is missing');
        }

        const response = await fetch(`/.netlify/functions/getcalendar?id_service=${service.id}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.dates) {
            throw new Error('Неверный формат данных календаря');
        }
        
        // Инициализируем текущую неделю
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        renderWeekDays(today);
        
    } catch (error) {
        console.error('Ошибка загрузки календаря:', error);
        container.innerHTML = `<p class="error">${error.message}</p>`;
    }
}
    
    // Отрисовка календаря
function renderWeekDays(startDate) {
    const container = document.getElementById('week-days-container');
    const weekDays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Клонируем startDate и выравниваем по началу дня
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);

    let html = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);

        // Пропускаем прошедшие даты
        if (date < today) continue;

        const day = date.getDate();
        const weekDay = weekDays[date.getDay()];
        // Форматируем дату вручную, чтобы избежать смещений из-за UTC
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const isToday = date.toDateString() === new Date().toDateString();

        html += `
            <div class="day-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="week-day">${weekDay}</div>
                <div class="day-number">${day}</div>
            </div>
        `;
    }

    container.innerHTML = html || '<p>Нет доступных дат</p>';
    updateWeekRangeText(weekStart);

    // Обработчики клика по дням
    document.querySelectorAll('.day-cell').forEach(cell => {
        cell.addEventListener('click', function () {
            document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');

            selectedDate = this.getAttribute('data-date'); // Сохраняем выбранную дату
            loadMastersSlots(selectedDate, selectedService.duration);

            // Показываем следующий шаг автоматически
            document.getElementById('step-masters').style.display = 'block';
        });
    });
}

function updateWeekRangeText(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const rangeElement = document.getElementById('current-week-range');
    rangeElement.textContent = `
        ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
    `;
}

// Добавьте обработчики для кнопок недели
document.getElementById('prev-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderWeekDays(currentWeekStart);
});

document.getElementById('next-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderWeekDays(currentWeekStart);
});

// Новая функция для загрузки мастеров и слотов
async function loadMastersSlots(date) {
    const container = document.getElementById('masters-slots-container');
    container.innerHTML = '<div class="loader">Загрузка мастеров...</div>';

    if (!selectedService || !selectedService.id) {
        console.error('Ошибка: услуга не выбрана или отсутствует id');
        container.innerHTML = '<p class="error">Пожалуйста, выберите услугу</p>';
        return;
    }

    try {
        const mastersResponse = await fetch(`/.netlify/functions/getmaster?date=${date}`);
        const mastersData = await mastersResponse.json();
        console.log('Masters data:', mastersData);

        let html = '';
        for (const master of mastersData.masters) {
            console.log(`Fetching slots for master ${master.id_master}`);
            const slotsResponse = await fetch(
                `/.netlify/functions/gettimeslots?date=${date}&master_id=${master.id_master}&service_id=${selectedService.id}`
            );
            const slotsData = await slotsResponse.json();
            console.log(`Slots data for master ${master.id_master}:`, slotsData);

            if (slotsData.slots && slotsData.slots.length > 0) {
                html += `
                    <div class="master-slots">
                        <h3>${master.name_master}</h3>
                        <div class="master-slots-grid">
                            ${slotsData.slots.map(slot => `
                                <button class="time-slot"
                                    data-slot-id="${slot.id_slot}"
                                    data-master-id="${master.id_master}"
                                    data-master-name="${master.name_master}">
                                    ${slot.start_time}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                console.log(`No slots available for master ${master.id_master}`);
            }
        }

        container.innerHTML = html || '<p>Нет доступных мастеров на эту дату</p>';

        document.querySelectorAll('.time-slot').forEach(button => {
            button.addEventListener('click', function () {
                document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');

                selectedSlot = this.getAttribute('data-slot-id');
                selectedMaster = {
                    id: this.getAttribute('data-master-id'),
                    name: this.getAttribute('data-master-name')
                };

                console.log('✅ Slot selected:', selectedSlot);
                console.log('✅ Master selected:', selectedMaster);
                updateBookingNavigation();
            });
        });

        document.getElementById('step-masters').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки мастеров:', error);
        container.innerHTML = '<p class="error">Ошибка загрузки данных</p>';
    }
}

    // функция для показа сводки
    function showConfirmationSummary() {
    const summaryContainer = document.getElementById('step-confirmation');
    if (!summaryContainer) return;
    
    const timeSlot = document.querySelector('.time-slot.selected');
    
    summaryContainer.innerHTML = `
        <div class="confirmation-summary">
            <h3>Подтверждение записи</h3>
            <div class="summary-item">
                <span class="summary-label">💇 Услуга:</span>
                <span class="summary-value">${selectedService.name_length} (${selectedService.name}) (${selectedService.price})</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">📅 Дата:</span>
                <span class="summary-value">${formatDate(selectedDate)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">⏰ Время:</span>
                <span class="summary-value">${timeSlot.textContent}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">👩‍🎨 Мастер:</span>
                <span class="summary-value">${selectedMaster.name || 'не выбран'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">📝 Комментарий:</span>
                <span class="summary-value">${document.getElementById('booking-comment').value || 'нет'}</span>
            </div>
        </div>
    `;
}

// Добавьте функцию форматирования даты
function formatDate(dateStr) {
    // Предполагаем, что dateStr в формате YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day); // Месяцы в JS начинаются с 0
    const options = { day: 'numeric', month: 'long', weekday: 'short' };
    return date.toLocaleDateString('ru-RU', options);
}

    // Подтверждение записи
    async function confirmBooking() {
    const tg = window.Telegram.WebApp;
    const comment = document.getElementById('booking-comment').value;
    const timeSlot = document.querySelector('.time-slot.selected');

    if (!selectedService || !selectedSlot || !selectedMaster || !selectedMaster.id) {
        console.error('❌ Отсутствуют обязательные данные:', {
            selectedService,
            selectedSlot,
            selectedMaster
        });
        alert('Пожалуйста, выберите услугу, мастера и время');
        return;
    }
    

    let userId = tg.initDataUnsafe.user.id;

    // Если мастер, создаём клиента
    if (isCurrentUserMaster) {
        const name = document.getElementById('client-name').value.trim();
        const phone = document.getElementById('client-phone').value.trim();

        if (!name || !phone) {
            alert('Введите имя и телефон клиента');
            return;
        }

        try {
            const clientResponse = await fetch('/.netlify/functions/createclient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });

            const clientData = await clientResponse.json();
            if (!clientData.id_user) {
                alert('Ошибка при создании клиента');
                return;
            }

            userId = clientData.id_user;
        } catch (err) {
            alert('Ошибка соединения при создании клиента');
            return;
        }
    }
    // Убедимся, что selectedDate в формате YYYY-MM-DD
    const [year, month, day] = selectedDate.split('-');
    const formattedDate = `${year}-${month}-${day}`; // Гарантируем формат
        
    try {
        const response = await fetch('/.netlify/functions/createbooking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                service_id: selectedService.id,
                service_length: selectedService.name_length,
                service_name: selectedService.name,
                service_price: selectedService.price,
                slot_id: selectedSlot,
                master_id: selectedMaster.id,
                master_name: selectedMaster.name,
                date: formattedDate,
                time: timeSlot.textContent,
                comment: comment
            })
        });

        if (response.ok) {
            const result = await response.json();
            showConfirmation(result);
        } else {
            throw new Error('Ошибка при создании записи');
        }
    } catch (error) {
        console.error('❌ Ошибка запроса:', error);
        alert(error.message);
    }
}

    
    // Показать подтверждение записи
    function showConfirmation(booking) {
    const formContainer = document.getElementById('booking-form-container');
    formContainer.innerHTML = `
        <div class="confirmation success-message">
            <h2>🎉 Вы успешно записались!</h2>
            <div class="confirmation-details">
                <p align="center">Детали записи Вы можете посмотреть во вкладке</p>
                <p align="center"><strong>"Мои записи 📅"</strong></p>
            </div>
        </div>
    `;

    //document.getElementById('close-booking').addEventListener('click', () => {
    //    formContainer.style.display = 'none';
    //});
}
}

// Обработка навигации
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const pageId = this.getAttribute('data-page');
        
        // Убираем активный класс у всех
        document.querySelectorAll('.nav-item').forEach(i => {
            i.classList.remove('active');
        });
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Добавляем активный класс текущему
        this.classList.add('active');
        document.getElementById(`page-${pageId}`).classList.add('active');
        
        if (pageId === 'bookings') {
            if (isCurrentUserMaster) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                renderWeekForMaster(currentWeekStart);
                initMasterCalendarNavigation();
                loadMasterBookingsByDate(today.toISOString().split('T')[0]);
            } else {
                loadUserBookings();
            }
        } else if (pageId === 'masters') {
            loadMasters(); 
        }

    });
});

// Загрузка записей пользователя
async function loadUserBookings() {
    const container = document.getElementById('bookings-list');
    container.innerHTML = '<div class="loader">Загрузка записей...</div>';
    
    try {
        const tg = window.Telegram.WebApp;
        const response = await fetch(`/.netlify/functions/getappointments?user_id=${tg.initDataUnsafe.user.id}`);
        const data = await response.json();
        
        if (data.bookings && data.bookings.length > 0) {
            let html = '';
            data.bookings.forEach(booking => {
                html += `
                    <div class="booking-item">
                        <div class="booking-service"><p>Вы записаны на услугу 💇:</p><p>${booking.service_length} (${booking.service_name})</p></div>
                        <div class="booking-date">📅 ${booking.date} в ${booking.time}</div>
                        <div class="booking-master">👩‍🎨 К мастеру: ${booking.master_name}</div>
                        <div class="booking-master">📝 Ваш комментарий: ${booking.comment || 'нет'}</div>
                        <div class="booking-master">💰 Стоимость: ${booking.price}.0 ₽</div>
                        <button class="cancel-btn" data-booking-id="${booking.id_app}">Отменить</button>
                    </div>
                `;
            });
            container.innerHTML = html;
            
            // Добавляем обработчики отмены
            document.querySelectorAll('.cancel-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const bookingId = this.getAttribute('data-booking-id');
                    if (confirm('Вы уверены, что хотите отменить запись?')) {
                        await cancelBooking(bookingId);
                        loadUserBookings(); // Обновляем список
                    }
                });
            });
        } else {
            container.innerHTML = '<p>У вас нет активных записей</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки записей</p>';
    }
}

// Загрузка информации о мастерах
async function loadMasters() {
    const btnContainer = document.getElementById('master-buttons');
    const infoContainer = document.getElementById('master-info');
    btnContainer.innerHTML = '<div class="loader">Загрузка мастеров...</div>';
    infoContainer.innerHTML = '';

    try {
        const response = await fetch('/.netlify/functions/getmasters');
        const data = await response.json();
        const masters = data.masters;

        if (!masters || masters.length === 0) {
            btnContainer.innerHTML = '<p>Информация о мастерах временно недоступна</p>';
            return;
        }

        btnContainer.innerHTML = '';

        masters.forEach((master, index) => {
            const btn = document.createElement('button');
            btn.textContent = master.name_master;
            btn.className = 'master-button';
            if (index === 0) btn.classList.add('active');
            btn.addEventListener('click', () => {
                document.querySelectorAll('.master-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                displayMasterInfo(master);
            });
            btnContainer.appendChild(btn);
        });

        // Показать первого мастера
        displayMasterInfo(masters[0]);

    } catch (error) {
        btnContainer.innerHTML = '<p class="error">Ошибка загрузки мастеров</p>';
        infoContainer.innerHTML = '';
    }
}

// Функция отмены записи
async function cancelBooking(bookingId) {
    try {
        const response = await fetch('/.netlify/functions/cancelbooking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: bookingId })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка отмены записи');
        }
        
        alert('Запись успешно отменена');
    } catch (error) {
        alert(error.message);
    }
}

let currentPhotos = [];
let currentIndex = 0;

function openModal(photoObj, index) {
  const modal = document.getElementById('portfolio-modal');
  const modalImg = document.getElementById('modal-photo');
  const modalDesc = document.getElementById('modal-description');

  modalImg.src = photoObj.photo;
  modalDesc.textContent = photoObj.description_photo || 'Описание отсутствует';
  currentIndex = index;
  modal.classList.remove('hidden');
}

document.getElementById('close-portfolio-modal').addEventListener('click', () => {
  document.getElementById('portfolio-modal').classList.add('hidden');
});

document.getElementById('prev-photo').addEventListener('click', () => {
  if (currentPhotos.length === 0) return;
  currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
  openModal(currentPhotos[currentIndex], currentIndex);
});

document.getElementById('next-photo').addEventListener('click', () => {
  if (currentPhotos.length === 0) return;
  currentIndex = (currentIndex + 1) % currentPhotos.length;
  openModal(currentPhotos[currentIndex], currentIndex);
});


async function displayMasterInfo(master) {
    const container = document.getElementById('master-info');
    container.innerHTML = `
        <div class="master-card">
            <h3>${master.name_master}</h3>
            <p>Телефон: ${master.phone_master}</p>
            <p>${master.description || 'Опытный мастер'}</p>
            <div class="portfolio-grid" id="portfolio-${master.id_master}">Загрузка портфолио...</div>
        </div>
    `;

    try {
        const res = await fetch(`/.netlify/functions/getportfolio?master_id=${master.id_master}`);
        const data = await res.json();
        const grid = document.getElementById(`portfolio-${master.id_master}`);
        if (data.photos && data.photos.length > 0) {
  currentPhotos = data.photos;

  grid.innerHTML = currentPhotos.map((photo, index) => `
    <img src="${photo.photo}" class="portfolio-photo" data-index="${index}">
  `).join('');

  grid.querySelectorAll('.portfolio-photo').forEach((img, index) => {
    img.addEventListener('click', () => openModal(currentPhotos[index], index));
  });
} else {
  grid.innerHTML = '<p>Портфолио пока пусто</p>';
}

    } catch (err) {
        container.querySelector('.portfolio-grid').innerHTML = '<p class="error">Ошибка загрузки портфолио</p>';
    }
}

function renderWeekForMaster(startDate) {
    const container = document.getElementById('week-days-master');
    const weekDays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Клонируем startDate и выравниваем по началу дня
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);

    let html = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);

        const day = date.getDate();
        const weekDay = weekDays[date.getDay()];
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const isToday = date.toDateString() === new Date().toDateString();

        html += `
            <div class="day-cell ${isToday ? 'today selected' : ''}" data-date="${dateStr}">
                <div class="week-day">${weekDay}</div>
                <div class="day-number">${day}</div>
            </div>
        `;
    }

    container.innerHTML = html || '<p>Нет доступных дат</p>';
    updateMasterWeekRangeText(weekStart);

    // Выбираем текущий день по умолчанию
    const todayCell = container.querySelector('.day-cell.today');
    if (todayCell) {
        todayCell.classList.add('selected');
        selectedDate = todayCell.getAttribute('data-date');
        loadMasterBookingsByDate(selectedDate);
    }

    // Обработчики клика по дням
    document.querySelectorAll('#week-days-master .day-cell').forEach(cell => {
        cell.addEventListener('click', function () {
            document.querySelectorAll('#week-days-master .day-cell').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedDate = this.getAttribute('data-date');
            loadMasterBookingsByDate(selectedDate);
        });
    });
}

// Обновление текста диапазона недель
function updateMasterWeekRangeText(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const rangeElement = document.getElementById('master-current-week-range');
    if (rangeElement) {
        rangeElement.textContent = `${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`;
    } else {
        console.error('Element #master-current-week-range not found');
    }
}

// Инициализация навигации по неделям
function initMasterCalendarNavigation() {
    const prevButton = document.getElementById('master-prev-week');
    const nextButton = document.getElementById('master-next-week');
    
    if (!prevButton || !nextButton) {
        console.error('Navigation buttons not found');
        return;
    }

    prevButton.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderWeekForMaster(currentWeekStart);
    });

    nextButton.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderWeekForMaster(currentWeekStart);
    });
}


// Показать модальное окно календаря
// Показать модальное окно календаря
document.getElementById('edit-calendar-btn').addEventListener('click', () => {
    const modal = document.getElementById('calendar-modal');
    modal.classList.remove('hidden');
    currentMonth = new Date();
    renderCalendar(currentMonth);
});

// Закрыть модальное окно
document.getElementById('calendar-modal-close').addEventListener('click', () => {
    document.getElementById('calendar-modal').classList.add('hidden');
});

let currentMonth = new Date();

// Отрисовка календаря на месяц
async function renderCalendar(date) {
    const container = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('current-month');
    const weekdaysContainer = document.getElementById('calendar-weekdays');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user.id;

    const year = date.getFullYear();
    const month = date.getMonth();
    monthYear.textContent = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

    // Ограничение навигации
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();
    const maxMonth = new Date(currentYear, currentMonthIndex + 1);
    const minMonth = new Date(currentYear, currentMonthIndex);

    prevMonthBtn.disabled = date.getFullYear() === minMonth.getFullYear() && date.getMonth() === minMonth.getMonth();
    nextMonthBtn.disabled = date.getFullYear() === maxMonth.getFullYear() && date.getMonth() === maxMonth.getMonth();

    // Отображение дней недели
    const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    weekdaysContainer.innerHTML = weekdays.map(day => `<div>${day}</div>`).join('');

    // Получаем первый день месяца и количество дней
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Корректируем для ПН как первого дня

    // Получаем данные о рабочих днях и записях
    try {
        const response = await fetch(`/.netlify/functions/getcalendardata?user_id=${userId}&month=${year}-${String(month + 1).padStart(2, '0')}`);
        if (!response.ok) {
            throw new Error(`Ошибка при загрузке данных календаря: ${response.status}`);
        }
        const data = await response.json();
        const workDays = data.workdays || [];
        const bookings = data.bookings || [];

        let html = '';
        // Добавить пустые клетки для начала месяца
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day disabled"></div>';
        }

        // Отрисовка дней
        today.setHours(0, 0, 0, 0);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPast = new Date(year, month, day) < today;
            const workDay = workDays.find(w => w.date_work === dateStr);
            const hasBookings = bookings.some(b => b.date === dateStr);
            let className = 'calendar-day';

            if (workDay && workDay.is_working) {
                className += hasBookings ? ' booked' : ' working';
            } else {
                className += ' holiday';
            }

            if (isPast) {
                className += ' disabled';
            }

            html += `<div class="${className}" data-date="${dateStr}" ${isPast ? 'disabled' : ''}>${day}</div>`;
        }

        container.innerHTML = html;

        // Обработчики клика по дням
        document.querySelectorAll('.calendar-day:not(.disabled)').forEach(cell => {
            cell.addEventListener('click', async () => {
                const date = cell.getAttribute('data-date');
                await toggleWorkDay(date, userId);
                renderCalendar(new Date(date)); // Перерисовываем календарь
            });
        });
    } catch (error) {
        console.error('Ошибка в renderCalendar:', error);
        alert('Не удалось загрузить данные календаря. Попробуйте позже.');
    }

    // Навигация по месяцам
    prevMonthBtn.onclick = () => {
        if (!prevMonthBtn.disabled) {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            renderCalendar(currentMonth);
        }
    };

    nextMonthBtn.onclick = () => {
        if (!nextMonthBtn.disabled) {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            renderCalendar(currentMonth);
        }
    };
}

// Переключение статуса дня (рабочий/выходной)
async function toggleWorkDay(date, userId) {
    try {
        // Форматируем дату для сообщений
        const formattedDate = new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // Получаем данные о записях
        const appResponse = await fetch(`/.netlify/functions/getapp?user_id=${userId}&date=${date}`);
        if (!appResponse.ok) {
            throw new Error(`Ошибка при загрузке записей: ${appResponse.status}`);
        }
        const appData = await appResponse.json();
        const bookings = appData.bookings || [];

        // Получаем статус рабочего дня
        const workDayResponse = await fetch(`/.netlify/functions/getworkday?user_id=${userId}&date=${date}`);
        if (!workDayResponse.ok) {
            throw new Error(`Ошибка при загрузке статуса дня: ${workDayResponse.status}`);
        }
        const workDayData = await workDayResponse.json();
        const isWorking = workDayData.is_working;

        // Подтверждение изменения статуса
        const action = isWorking ? 'выходным' : 'рабочим';
        let confirmMessage = `Вы уверены, что хотите сделать ${formattedDate} ${action}?`;
        if (isWorking && bookings.length > 0) {
            confirmMessage = `На ${formattedDate} есть ${bookings.length} записей. Вы уверены, что хотите отменить все записи и сделать этот день выходным?`;
        }

        const confirmed = confirm(confirmMessage);
        if (!confirmed) {
            console.log('Пользователь отменил изменение статуса дня:', date);
            return;
        }

        // Отправляем запрос на изменение статуса
        console.log(`Отправка запроса на изменение статуса дня ${date}: is_working = ${!isWorking}`);
        const response = await fetch('/.netlify/functions/toggleworkday', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                date: date,
                is_working: !isWorking
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка при обновлении статуса дня: ${errorData.error || response.status}`);
        }

        const result = await response.json();
        console.log('Ответ от сервера:', result);
        alert(`День ${formattedDate} установлен как ${action}`);
    } catch (error) {
        console.error('Ошибка в toggleWorkDay:', error);
        alert(`Не удалось изменить статус дня: ${error.message}`);
    }
}

// Загрузка записей мастера
async function loadMasterBookingsByDate(date) {
    const container = document.getElementById('master-bookings-list');
    container.innerHTML = '<div class="loader">Загрузка записей...</div>';

    try {
        const tg = window.Telegram.WebApp;
        const response = await fetch(`/.netlify/functions/getapp?user_id=${tg.initDataUnsafe.user.id}&date=${date}`);
        const data = await response.json();
        const [yyyy, mm, dd] = date.split('-');
        const formattedDate = `${dd}.${mm}.${yyyy}`;
        
        if (data.bookings && data.bookings.length > 0) {
            let html = `<h3>Записи на ${formattedDate}</h3>`;

            data.bookings.forEach(booking => {
                const phoneLink = booking.phone_user?.replace(/[^0-9]/g, '');
                html += `
                    <div class="booking-item">
                        <div><strong>${booking.time}</strong> — ${booking.name_user || 'Клиент'}</div>
                        <div>📞 ${booking.phone_user || 'нет'}
                            ${phoneLink ? `
                                <a href="tel:+${phoneLink}" class="phone-link">📲</a>
                                <a href="https://t.me/+${phoneLink}" class="tg-link">Telegram</a>
                            ` : ''}
                        </div>
                        <div>💇 ${booking.service_length} (${booking.service_name})</div>
                        <div>💰 ${booking.price}.0 ₽</div>
                        <div>💬 Комментарий: ${booking.comment || 'нет'}</div>
                        <button class="cancel-btn" data-booking-id="${booking.id_app}">Отменить</button>
                    </div>
                `;
            });

            container.innerHTML = html;
            document.querySelectorAll('.cancel-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const bookingId = this.getAttribute('data-booking-id');
                    if (confirm('Вы уверены, что хотите отменить запись?')) {
                        await cancelBooking(bookingId);
                        loadMasterBookingsByDate(date); // Обновляем список
                    }
                });
            });
        } else {
            container.innerHTML = `<p>На ${formattedDate} записей нет</p>`;
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки записей</p>';
        console.error('loadMasterBookingsByDate error:', error);
    }
}




// Инициализация модального окна портфолио
function initPortfolioEditModal() {
    const editButton = document.getElementById('edit-portfolio-btn');
    const modal = document.getElementById('portfolio-edit-modal');
    const closeModal = document.getElementById('close-portfolio-edit-modal');
    const addPhotoButton = document.getElementById('add-portfolio-photo');

    editButton.addEventListener('click', () => {
        modal.classList.remove('hidden');
        loadPortfolioEditList();
    });

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    addPhotoButton.addEventListener('click', async () => {
        const photoInput = document.getElementById('new-portfolio-photo');
        const description = document.getElementById('new-portfolio-description').value;

        if (!photoInput.files[0]) {
            alert('Выберите фото');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const photo = e.target.result;
            await addPortfolioPhoto(photo, description);
            loadPortfolioEditList();
        };
        reader.readAsDataURL(photoInput.files[0]);
    });
}

// Загрузка списка фотографий для редактирования
async function loadPortfolioEditList() {
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user.id;
    const container = document.getElementById('portfolio-edit-list');
    container.innerHTML = '<div class="loader">Загрузка портфолио...</div>';

    try {
        const response = await fetch(`/.netlify/functions/getportfolio?master_id=${userId}`);
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            container.innerHTML = data.photos.map((photo) => `
                <div class="portfolio-item" data-photo-id="${photo.id_photo}">
                    <img src="${photo.photo}" class="portfolio-photo">
                    <textarea class="form-control" data-description="${photo.id_photo}">${photo.description_photo || ''}</textarea>
                    <button class="save-description-btn" data-photo-id="${photo.id_photo}">Сохранить описание</button>
                    <button class="delete-portfolio-photo" data-photo-id="${photo.id_photo}">Удалить</button>
                </div>
            `).join('');

            document.querySelectorAll('.save-description-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const photoId = btn.getAttribute('data-photo-id');
                    const description = document.querySelector(`textarea[data-description="${photoId}"]`).value;
                    await updatePortfolioDescription(photoId, description);
                    loadPortfolioEditList();
                });
            });

            document.querySelectorAll('.delete-portfolio-photo').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const photoId = btn.getAttribute('data-photo-id');
                    if (confirm('Удалить фото?')) {
                        await deletePortfolioPhoto(photoId);
                        loadPortfolioEditList();
                    }
                });
            });
        } else {
            container.innerHTML = '<p>Портфолио пусто</p>';
        }
    } catch (error) {
        console.error('Ошибка загрузки портфолио:', error);
        container.innerHTML = '<p class="error">Ошибка загрузки портфолио</p>';
    }
}

// Добавление нового фото в портфолио
async function addPortfolioPhoto(photo, description) {
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user.id;
    try {
        const response = await fetch('/.netlify/functions/add_portfolio_photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, photo, description })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Фото добавлено');
            document.getElementById('new-portfolio-photo').value = '';
            document.getElementById('new-portfolio-description').value = '';
            loadPortfolioEditList(); // Обновляем список портфолио
        } else {
            throw new Error(data.error || 'Ошибка добавления фото');
        }
    } catch (error) {
        console.error('Ошибка при добавлении фото:', error);
        alert('Ошибка добавления фото: ' + error.message);
    }
}

// Обновление описания фото
async function updatePortfolioDescription(photoId, description) {
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user.id;
    try {
        const response = await fetch('/.netlify/functions/update_portfolio_description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, photo_id: photoId, description })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Описание обновлено');
        } else {
            console.error('Ошибка сервера:', data);
            throw new Error(data.error || `Ошибка обновления описания (статус: ${response.status})`);
        }
    } catch (error) {
        console.error('Ошибка при обновлении описания:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// Удаление фото из портфолио
async function deletePortfolioPhoto(photoId) {
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user.id;
    try {
        const response = await fetch('/.netlify/functions/delete_portfolio_photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, photo_id: photoId })
        });
        const data = await response.json(); // Парсим ответ один раз здесь
        if (response.ok) {
            alert('Фото удалено');
        } else {
            throw new Error(data.error || 'Ошибка удаления фото');
        }
    } catch (error) {
        console.error('Ошибка при удалении фото из портфолио:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// Обработчик выбора файла для нового фото в портфолио
document.getElementById('new-portfolio-photo').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Файл не выбран');
        return;
    }

    // Проверяем размер файла (до 3 МБ)
    if (file.size > 3 * 1024 * 1024) {
        alert('Файл слишком большой. Выберите фото до 3 МБ.');
        return;
    }

    // Проверяем тип файла (только JPEG или PNG)
    if (!file.type.match('image/jpeg|image/png|image/jpg')) {
        alert('Поддерживаются только форматы JPEG и PNG.');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const photo = e.target.result; // Base64 строка
            const description = document.getElementById('new-portfolio-description').value;
            await addPortfolioPhoto(photo, description);
            // loadPortfolioEditList() вызывается внутри addPortfolioPhoto, если нужно
        };
        reader.onerror = function() {
            alert('Ошибка чтения файла. Попробуйте другое фото.');
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Ошибка обработки файла:', error);
        alert('Ошибка обработки файла: ' + error.message);
    }
});

// Показ кнопки "Редактировать услуги" для админов
async function checkAndShowEditServicesButton() {
    const tg = window.Telegram.WebApp;
    const userId = tg.initDataUnsafe.user.id;
    try {
        const response = await fetch(`/.netlify/functions/isadmin?user_id=${userId}`);
        const data = await response.json();
        if (data.is_admin) {
            document.getElementById('edit-services-btn').style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка проверки админа:', error);
    }
}

// Инициализация модального окна для редактирования услуг
function initServicesEditModal() {
    const editButton = document.getElementById('edit-services-btn');
    const modal = document.getElementById('services-edit-modal');
    const closeModal = document.getElementById('close-services-edit-modal');
    const servicesTab = document.getElementById('tab-services');
    const materialsTab = document.getElementById('tab-materials');
    const servicesContent = document.getElementById('services-tab-content');
    const materialsContent = document.getElementById('materials-tab-content');

    editButton.addEventListener('click', () => {
        modal.classList.remove('hidden');
        servicesTab.classList.add('active');
        materialsTab.classList.remove('active');
        servicesContent.classList.remove('hidden');
        materialsContent.classList.add('hidden');
        loadServicesEditList();
    });

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    servicesTab.addEventListener('click', () => {
        servicesTab.classList.add('active');
        materialsTab.classList.remove('active');
        servicesContent.classList.remove('hidden');
        materialsContent.classList.add('hidden');
        loadServicesEditList();
    });

    materialsTab.addEventListener('click', () => {
        servicesTab.classList.remove('active');
        materialsTab.classList.add('active');
        servicesContent.classList.add('hidden');
        materialsContent.classList.remove('hidden');
        loadMaterialsEditList();
    });
}

// Загрузка списка услуг для редактирования
async function loadServicesEditList() {
    const container = document.getElementById('services-tab-content');
    container.innerHTML = '<div class="loader">Загрузка услуг...</div>';

    try {
        const response = await fetch('/.netlify/functions/getservicesedit');
        const data = await response.json();
        console.log('Loaded services data:', data);
        if (data.services && data.services.length > 0) {
            let html = `
                <div class="add-service-form">
                    <h4>Добавить новую услугу</h4>
                    <input type="text" id="new-service-name" placeholder="Новая услуга">
                    <select id="new-service-category">
                        <option value="1">Женский каталог</option>
                        <option value="2">Мужской каталог</option>
                    </select>
                    <select id="new-service-length">
                        ${data.hairlengths.map(h => `<option value="${h.id_length}">${h.name_length}</option>`).join('')}
                        <option value="new">Новый подраздел</option>
                    </select>
                    <input type="text" id="new-length-name" placeholder="Название нового подраздела" style="display: none;">
                    <input type="checkbox" id="new-service-ot"> <label for="new-service-ot">Цена "от"</label>
                    <input type="number" id="new-service-price" placeholder="Цена (₽)">
                    <input type="number" id="new-service-duration" placeholder="Длительность (мин)">
                    <div class="material-list" id="new-service-materials">
                        <h5>Материалы</h5>
                    </div>
                    <button id="add-material-btn" class="form-button">Добавить материал</button>
                    <button id="add-service-btn" class="form-button">Добавить услугу</button>
                </div>
            `;
            data.services.forEach(service => {
                html += `
                    <div class="service-edit-item" data-service-id="${service.id_service}">
                        <input type="text" value="${service.name_service}" disabled>
                        <input type="text" value="${service.name_length}" disabled>
                        <input type="number" value="${service.price}" data-price="${service.id_service}">
                        <label><input type="checkbox" ${service.ot ? 'checked' : ''} data-ot="${service.id_service}"> От</label>
                        <div class="material-list" id="materials-${service.id_service}">
                            ${service.materials.map(m => `
                                <div class="material-item" data-id-material="${m.id_material}">
                                    <span>${m.name_material}</span>
                                    <input type="number" name="quantity" value="${m.quantity_ml || m.quant || ''}" data-material-id="${m.id_material}">
                                    <button class="delete-material-btn" data-material-id="${m.id_material}" data-service-id="${service.id_service}">Удалить</button>
                                </div>
                            `).join('')}
                        </div>
                        <select class="add-material-select" data-service-id="${service.id_service}">
                            <option value="">Выберите материал</option>
                            ${data.materials.map(m => `<option value="${m.id_material}">${m.name_material}</option>`).join('')}
                        </select>
                        <button class="add-material-to-service-btn" data-service-id="${service.id_service}">Добавить материал</button>
                        <button class="save-service-btn" data-service-id="${service.id_service}">Сохранить</button>
                        <button class="delete-service-btn" data-service-id="${service.id_service}">Удалить</button>
                    </div>
                `;
            });
            container.innerHTML = html;

            // Обработчики для добавления новой услуги
            document.getElementById('new-service-length').addEventListener('change', (e) => {
                document.getElementById('new-length-name').style.display = e.target.value === 'new' ? 'block' : 'none';
            });

            document.getElementById('add-material-btn').addEventListener('click', () => {
                addMaterialField('new-service-materials');
            });
            document.getElementById('add-service-btn').addEventListener('click', addNewService);

            // Обработчики для существующих услуг
            document.querySelectorAll('.save-service-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const serviceId = btn.getAttribute('data-service-id');
                    await updateService(serviceId);
                });
            });

            document.querySelectorAll('.delete-service-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const serviceId = btn.getAttribute('data-service-id');
                    if (confirm('Удалить услугу и связанные записи?')) {
                        await deleteService(serviceId);
                        loadServicesEditList();
                    }
                });
            });

            // Обработчик для добавления материала к существующей услуге
            document.querySelectorAll('.add-material-to-service-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const serviceId = btn.getAttribute('data-service-id');
                    const select = document.querySelector(`select.add-material-select[data-service-id="${serviceId}"]`);
                    const materialId = select.value;
                    const materialName = select.selectedOptions[0]?.text || '';

                    if (!materialId) {
                        alert('Выберите материал');
                        return;
                    }

                    const materialList = document.getElementById(`materials-${serviceId}`);
                    const materialItem = document.createElement('div');
                    materialItem.className = 'material-item';
                    materialItem.setAttribute('data-id-material', materialId);
                    materialItem.innerHTML = `
                        <span>${materialName}</span>
                        <input type="number" data-quantity="${materialId}" value="0">
                        <button class="delete-material-btn" data-material-id="${materialId}" data-service-id="${serviceId}">Удалить</button>
                    `;
                    materialList.appendChild(materialItem);

                    // Обработчик для удаления нового материала
                    materialItem.querySelector(`.delete-material-btn[data-material-id="${materialId}"]`).addEventListener('click', async () => {
                        if (confirm('Удалить материал из услуги?')) {
                            await deleteMaterialFromService(serviceId, materialId);
                            loadServicesEditList();
                        }
                    });

                    // Сброс выбора
                    select.value = '';
                });
            });

            document.querySelectorAll('.delete-material-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const materialId = btn.getAttribute('data-material-id');
                    const serviceId = btn.getAttribute('data-service-id');
                    if (confirm('Удалить материал из услуги?')) {
                        await deleteMaterialFromService(serviceId, materialId);
                        loadServicesEditList();
                    }
                });
            });
        } else {
            container.innerHTML = '<p>Услуги отсутствуют</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки услуг</p>';
        console.error('Ошибка загрузки услуг:', error);
    }
}

// Добавление поля для материала
async function addMaterialField(containerId, serviceId = null) {
    const container = document.getElementById(containerId);
    const response = await fetch('/.netlify/functions/getmaterials');
    const data = await response.json();
    
    // Создаем уникальный идентификатор для нового элемента
    const tempId = `temp-${Date.now()}`;
    
    // Создаем HTML для нового материала
    const materialItem = document.createElement('div');
    materialItem.className = 'material-item';
    materialItem.setAttribute('data-temp-id', tempId); // Используем временный ID
    materialItem.innerHTML = `
        <select data-material-select="${tempId}">
            <option value="">Выберите материал</option>
            ${data.materials.map(m => `<option value="${m.id_material}" data-name="${m.name_material}">${m.name_material}</option>`).join('')}
        </select>
        <input type="number" placeholder="Количество/ml" data-quantity="${tempId}" value="0">
        <button class="remove-material-btn" data-temp-id="${tempId}">Удалить</button>
    `;
    container.appendChild(materialItem);
    
    // Обработчик для удаления материала
    materialItem.querySelector(`.remove-material-btn[data-temp-id="${tempId}"]`).addEventListener('click', () => {
        materialItem.remove();
    });
    
    // При выборе материала обновляем data-id-material
    materialItem.querySelector(`select[data-material-select="${tempId}"]`).addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption.value) {
            materialItem.setAttribute('data-id-material', selectedOption.value);
            materialItem.removeAttribute('data-temp-id');
        }
    });
}

// Добавление новой услуги
async function addNewService() {
    const name = document.getElementById('new-service-name')?.value;
    const categoryId = document.getElementById('new-service-category')?.value;
    const lengthId = document.getElementById('new-service-length')?.value;
    const newLengthName = document.getElementById('new-length-name')?.value;
    const ot = document.getElementById('new-service-ot')?.checked;
    const price = document.getElementById('new-service-price')?.value;
    const duration = document.getElementById('new-service-duration')?.value;
    const materials = Array.from(document.querySelectorAll('#new-service-materials .material-item')).map(item => ({
        id_material: item.querySelector('select').value,
        quantity: item.querySelector('input[data-quantity]').value
    }));

    if (!name || !price || !duration) {
        alert('Заполните все обязательные поля');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/addservice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name_service: name,
                id_category: categoryId,
                id_length: lengthId === 'new' ? `new_${newLengthName}` : lengthId,
                ot: ot ? 'от' : null,
                price,
                duration_minutes: duration,
                materials
            })
        });
        if (response.ok) {
            alert('Услуга добавлена');
            await loadServicesEditList(); // Перезагружаем список
            // Очистка формы после перезагрузки
            const formReset = () => {
                const nameInput = document.getElementById('new-service-name');
                const priceInput = document.getElementById('new-service-price');
                const durationInput = document.getElementById('new-service-duration');
                const otInput = document.getElementById('new-service-ot');
                const materialsContainer = document.getElementById('new-service-materials');
                if (nameInput && priceInput && durationInput && otInput && materialsContainer) {
                    nameInput.value = '';
                    priceInput.value = '';
                    durationInput.value = '';
                    otInput.checked = false;
                    materialsContainer.innerHTML = '<h5>Материалы</h5>';
                }
            };
            setTimeout(formReset, 0); // Выполняем очистку асинхронно после рендеринга
        } else {
            throw new Error('Ошибка добавления услуги');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Обновление услуги
async function updateService(serviceId) {
    const price = document.querySelector(`input[data-price="${serviceId}"]`).value;
    const ot = document.querySelector(`input[data-ot="${serviceId}"]`).checked;
    const materials = Array.from(document.querySelectorAll(`#materials-${serviceId} .material-item`)).map(item => {
        const idMaterial = item.getAttribute('data-id-material') || item.querySelector('select')?.value;
        const quantityInput = item.querySelector('input[data-quantity]');
        if (!idMaterial) return null; // Пропускаем, если материал не выбран
        return {
            id_material: idMaterial,
            quantity: quantityInput ? parseFloat(quantityInput.value) || 0 : 0
        };
    }).filter(item => item !== null); // Удаляем null элементы

    console.log('Materials to send:', materials); // Для отладки

    try {
        const response = await fetch('/.netlify/functions/updateservice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_service: serviceId,
                price,
                ot: ot ? 'от' : null,
                materials
            })
        });
        if (response.ok) {
            alert('Услуга обновлена');
            loadServicesEditList();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления услуги');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
        console.error('Update service error:', error);
    }
}

// Удаление услуги
async function deleteService(serviceId) {
    try {
        const response = await fetch('/.netlify/functions/deleteservice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_service: serviceId })
        });
        if (response.ok) {
            alert('Услуга удалена');
        } else {
            throw new Error('Ошибка удаления услуги');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Удаление материала из услуги
async function deleteMaterialFromService(serviceId, materialId) {
    try {
        const response = await fetch('/.netlify/functions/deletematerialfromservice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_service: serviceId, id_material: materialId })
        });
        if (response.ok) {
            alert('Материал удален из услуги');
        } else {
            throw new Error('Ошибка удаления материала');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Загрузка списка материалов для редактирования
async function loadMaterialsEditList() {
    const container = document.getElementById('materials-tab-content');
    container.innerHTML = '<div class="loader">Загрузка материалов...</div>';

    try {
        const response = await fetch('/.netlify/functions/getmaterials');
        const data = await response.json();
        console.log('Materials data:', data); // Для отладки
        if (data.materials && data.materials.length > 0) {
            let html = `
                <div class="add-material-form">
                    <h4>Добавить новый материал</h4>
                    <input type="text" id="new-material-name" placeholder="Название материала">
                    <input type="number" id="new-material-price" placeholder="Цена (₽)">
                    <input type="number" id="new-material-ml" placeholder="Объем (мл)">
                    <input type="number" id="new-material-quantity" placeholder="Количество">
                    <button id="add-material-btn-final" class="form-button">Добавить материал</button>
                </div>
                <div class="materials-table-container">
                    <table class="materials-table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Цена (₽)</th>
                                <th>Объём (мл)</th>
                                <th>Количество</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            data.materials.forEach(material => {
                const isMlEmpty = !material.ml || material.ml === '';
                const isQuantityEmpty = !material.quantity || material.quantity === '';
                html += `
                    <tr class="material-edit-item" data-material-id="${material.id_material}">
                        <td>
                            <input type="text" value="${material.name_material}" disabled>
                        </td>
                        <td>
                            <input type="number" value="${material.price_mat}" data-price="${material.id_material}">
                        </td>
                        <td>
                            <input type="number" value="${material.ml || ''}" data-ml="${material.id_material}" ${isMlEmpty ? 'disabled' : ''}>
                        </td>
                        <td>
                            <input type="number" value="${material.quantity || ''}" data-quantity="${material.id_material}" ${isQuantityEmpty ? 'disabled' : ''}>
                        </td>
                        <td>
                            <button class="save-material-btn" data-material-id="${material.id_material}">Сохранить</button>
                            <button class="delete-material-btn" data-material-id="${material.id_material}">Удалить</button>
                        </td>
                    </tr>
                `;
            });
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            container.innerHTML = html;

            document.getElementById('add-material-btn-final').addEventListener('click', addNewMaterial);

            document.querySelectorAll('.save-material-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const materialId = btn.getAttribute('data-material-id');
                    await updateMaterial(materialId);
                });
            });

            document.querySelectorAll('.delete-material-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const materialId = btn.getAttribute('data-material-id');
                    if (confirm('Удалить материал и связанные записи?')) {
                        await deleteMaterial(materialId);
                        loadMaterialsEditList();
                    }
                });
            });

            // Оставляем только обработчик для "Объём (мл)"
            document.querySelectorAll('.materials-table td input[data-ml]').forEach(mlInput => {
                mlInput.addEventListener('input', (e) => {
                    const materialId = e.target.getAttribute('data-ml');
                    const mlValue = e.target.value.trim();
                    if (mlValue === '') {
                        e.target.disabled = true;
                    } else {
                        e.target.disabled = false;
                    }
                });
            });

            // Оставляем обработчик для "Количество"
            document.querySelectorAll('.materials-table td input[data-quantity]').forEach(quantityInput => {
                quantityInput.addEventListener('input', (e) => {
                    const materialId = e.target.getAttribute('data-quantity');
                    const quantityValue = e.target.value.trim();
                    if (quantityValue === '') {
                        e.target.disabled = true;
                    } else {
                        e.target.disabled = false;
                    }
                });
            });
        } else {
            container.innerHTML = '<p>Материалы отсутствуют</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки материалов</p>';
        console.error('Ошибка загрузки материалов:', error);
    }
}


// Добавление нового материала
async function addNewMaterial() {
    const name = document.getElementById('new-material-name')?.value;
    const price = document.getElementById('new-material-price')?.value;
    const ml = document.getElementById('new-material-ml')?.value;
    const quantity = document.getElementById('new-material-quantity')?.value;

    if (!name || !price) {
        alert('Заполните название и цену материала');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/addmaterial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name_material: name,
                price_mat: price,
                ml: ml || null,
                quantity: quantity || null
            })
        });
        if (response.ok) {
            alert('Материал добавлен');
            await loadMaterialsEditList(); // Перезагружаем список
            // Очистка формы после перезагрузки
            const formReset = () => {
                const nameInput = document.getElementById('new-material-name');
                const priceInput = document.getElementById('new-material-price');
                const mlInput = document.getElementById('new-material-ml');
                const quantityInput = document.getElementById('new-material-quantity');
                if (nameInput && priceInput && mlInput && quantityInput) {
                    nameInput.value = '';
                    priceInput.value = '';
                    mlInput.value = '';
                    quantityInput.value = '';
                }
            };
            setTimeout(formReset, 0); // Выполняем очистку асинхронно после рендеринга
        } else {
            throw new Error('Ошибка добавления материала');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Обновление материала
async function updateMaterial(materialId) {
    const price = document.querySelector(`input[data-price="${materialId}"]`).value;
    const ml = document.querySelector(`input[data-ml="${materialId}"]`).value;
    const quantity = document.querySelector(`input[data-quantity="${materialId}"]`).value;

    try {
        const response = await fetch('/.netlify/functions/updatematerial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_material: materialId,
                price_mat: price,
                ml: ml || null,
                quantity: quantity || null
            })
        });
        if (response.ok) {
            alert('Материал обновлен');
            loadMaterialsEditList();
        } else {
            throw new Error('Ошибка обновления материала');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Удаление материала
async function deleteMaterial(materialId) {
    try {
        const response = await fetch('/.netlify/functions/deletematerial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_material: materialId })
        });
        if (response.ok) {
            alert('Материал удален');
        } else {
            throw new Error('Ошибка удаления материала');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Вызов функций при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    checkAndShowEditServicesButton();
    initServicesEditModal();
});

