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
        showBookingForm();
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




// Показать форму записи
function showBookingForm() {
    const formContainer = document.getElementById('booking-form');
    
    if (!formContainer) {
        // Создаем форму записи если её нет
        const formHtml = `
        <div id="booking-form" class="booking-form">
            <h3>Форма записи</h3>
            
            <div class="form-group">
                <label>Каталог:</label>
                <select id="catalog-select" class="form-control">
                    <option value="">-- Выберите каталог --</option>
                    <option value="1">Женский каталог</option>
                    <option value="2">Мужской каталог</option>
                </select>
            </div>
            
            <div class="form-group" id="service-group" style="display:none;">
                <label>Услуга:</label>
                <select id="service-select" class="form-control">
                    <option value="">-- Выберите услугу --</option>
                </select>
            </div>
            
            <div class="form-group" id="date-group" style="display:none;">
                <label>Выберите дату:</label>
                <div id="calendar-container"></div>
            </div>
            
            <div class="form-group" id="time-group" style="display:none;">
                <label>Выберите время:</label>
                <div id="time-slots-container"></div>
            </div>
            
            <div class="form-group" id="master-group" style="display:none;">
                <label>Мастер:</label>
                <div id="masters-container"></div>
            </div>
            
            <div class="form-group" id="comment-group" style="display:none;">
                <label>Комментарий:</label>
                <textarea id="booking-comment" class="form-control"></textarea>
            </div>
            
            <button id="confirm-booking" class="btn-primary" disabled>Подтвердить запись</button>
        </div>
        `;
        
        document.querySelector('.main-content').insertAdjacentHTML('beforeend', formHtml);
        
        // Заполняем список услуг
        initBookingFormHandlers();
        

    }
    
    // Показываем/скрываем форму
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
}
// Инициализация обработчиков формы записи
function initBookingFormHandlers() {
    const catalogSelect = document.getElementById('catalog-select');
    const serviceSelect = document.getElementById('service-select');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let currentStep = 1;
    const totalSteps = 5; // Каталог -> Услуга -> Дата -> Время -> Комментарий
    
    // Обработчик выбора каталога
    catalogSelect.addEventListener('change', async function() {
        if (!this.value) {
            serviceSelect.innerHTML = '<option value="">-- Сначала выберите каталог --</option>';
            serviceSelect.disabled = true;
            return;
        }
        
        // Загружаем услуги для выбранного каталога
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
                        duration: item.duration_minutes || 60
                    });
                    option.textContent = `${item.name} (${item.price})`;
                    optgroup.appendChild(option);
                });
                
                serviceSelect.appendChild(optgroup);
            }
            
            serviceSelect.disabled = false;
        } catch (error) {
            console.error('Ошибка загрузки услуг:', error);
            serviceSelect.innerHTML = '<option value="">Ошибка загрузки услуг</option>';
        }
    });
    
    // Обработчик кнопки "Далее"
    nextBtn.addEventListener('click', async function() {
        if (currentStep >= totalSteps) {
            confirmBooking();
            return;
        }
        
        // Валидация текущего шага
        if (!validateStep(currentStep)) {
            return;
        }
        
        // Переход к следующему шагу
        currentStep++;
        updateFormSteps();
        
        // Загрузка данных для нового шага
        if (currentStep === 3) { // Шаг выбора даты
            const service = JSON.parse(serviceSelect.value);
            loadAvailableDates(service);
        }
    });
    
    // Обработчик кнопки "Назад"
    prevBtn.addEventListener('click', function() {
        if (currentStep <= 1) return;
        
        currentStep--;
        updateFormSteps();
    });
    
    // Обновление видимости шагов
    function updateFormSteps() {
        document.querySelectorAll('.form-step').forEach((step, index) => {
            step.style.display = index + 1 === currentStep ? 'block' : 'none';
        });
        
        prevBtn.disabled = currentStep === 1;
        nextBtn.textContent = currentStep === totalSteps ? 'Подтвердить' : 'Далее';
    }
    
    // Валидация шага
    function validateStep(step) {
        switch(step) {
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
                
            // Другие шаги...
            default:
                return true;
        }
    }
}

// Загрузка доступных дат
async function loadAvailableDates(service) {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loader">Загрузка доступных дат...</div>';
    
    try {
        const response = await fetch(`/.netlify/functions/getcalendar?duration=${service.duration}`);
        const data = await response.json();
        renderCalendar(data.dates);
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки дат</p>';
    }
}

// Рендер календаря
function renderCalendar(dates) {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    let html = '<div class="calendar-grid">';
    
    dates.forEach(date => {
        const dateObj = new Date(date.date);
        const day = dateObj.getDate();
        const isPast = dateObj < new Date();
        const isAvailable = date.has_available_slots;
        const isFull = !isAvailable && !isPast;
        
        html += `
            <div class="date-cell 
                ${isPast ? 'past' : ''} 
                ${isFull ? 'full' : ''}
                ${isAvailable ? 'available' : ''}"
                data-date="${date.date}">
                ${day}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Добавляем обработчики клика на даты
    document.querySelectorAll('.date-cell.available').forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.getAttribute('data-date');
            loadTimeSlots(date);
        });
    });
}

// Загрузка временных слотов
async function loadTimeSlots(date) {
    const serviceSelect = document.getElementById('service-select');
    if (!serviceSelect || !serviceSelect.value) return;
    
    const service = JSON.parse(serviceSelect.value);
    const container = document.getElementById('time-slots-container');
    
    container.innerHTML = '<div class="loader">Загрузка доступного времени...</div>';
    document.getElementById('time-group').style.display = 'block';
    
    try {
        const response = await fetch(`/.netlify/functions/gettimeslots?date=${date}&duration=${service.duration}`);
        const data = await response.json();
        renderTimeSlots(data.slots);
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки времени</p>';
    }
}

// Рендер временных слотов
function renderTimeSlots(slots) {
    const container = document.getElementById('time-slots-container');
    if (!container) return;
    
    let html = '<div class="time-slots-grid">';
    
    slots.forEach(slot => {
        html += `
            <button class="time-slot" data-slot-id="${slot.id_slot}" data-master-id="${slot.id_master}">
                ${slot.start_time}
            </button>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Добавляем обработчики клика на слоты времени
    document.querySelectorAll('.time-slot').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('master-group').style.display = 'block';
            document.getElementById('comment-group').style.display = 'block';
            document.getElementById('confirm-booking').disabled = false;
            
            // Здесь можно загрузить информацию о мастере
            const masterId = button.getAttribute('data-master-id');
            loadMasterInfo(masterId);
        });
    });
}

// Загрузка информации о мастере
async function loadMasterInfo(masterId) {
    const container = document.getElementById('masters-container');
    container.innerHTML = '<div class="loader">Загрузка информации о мастере...</div>';
    
    try {
        const response = await fetch(`/.netlify/functions/getmaster?id=${masterId}`);
        const data = await response.json();
        
        container.innerHTML = `
            <div class="master-info">
                <p><strong>Мастер:</strong> ${data.name_master}</p>
                <p><strong>Телефон:</strong> ${data.phone_master}</p>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки информации</p>';
    }
}

// Подтверждение записи
async function confirmBooking() {
    const tg = window.Telegram.WebApp;
    const serviceSelect = document.getElementById('service-select');
    const timeSlot = document.querySelector('.time-slot.selected');
    const comment = document.getElementById('booking-comment').value;
    
    if (!serviceSelect.value || !timeSlot) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const service = JSON.parse(serviceSelect.value);
    const slotId = timeSlot.getAttribute('data-slot-id');
    
    try {
        const response = await fetch('/.netlify/functions/createbooking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: tg.initDataUnsafe.user.id,
                service_id: service.id || 1, // Замените на реальный ID
                service_name: service.name,
                service_price: service.price,
                slot_id: slotId,
                comment: comment
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showBookingConfirmation(result);
        } else {
            throw new Error('Ошибка при создании записи');
        }
    } catch (error) {
        alert(error.message);
    }
}

// Показать подтверждение записи
function showBookingConfirmation(booking) {
    const formContainer = document.getElementById('booking-form');
    if (!formContainer) return;
    
    formContainer.innerHTML = `
        <div class="confirmation">
            <h3>Запись подтверждена!</h3>
            <p><strong>Услуга:</strong> ${booking.service_name}</p>
            <p><strong>Дата:</strong> ${booking.date}</p>
            <p><strong>Время:</strong> ${booking.time}</p>
            <p><strong>Мастер:</strong> ${booking.master}</p>
            <p><strong>Комментарий:</strong> ${booking.comment || 'нет'}</p>
            <button id="close-booking" class="btn-primary">Закрыть</button>
        </div>
    `;
    
    document.getElementById('close-booking').addEventListener('click', () => {
        formContainer.style.display = 'none';
        // Можно обновить страницу или сбросить форму
        location.reload();
    });
}
