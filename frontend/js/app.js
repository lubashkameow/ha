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
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        
        const data = await response.json();
        renderServices(data);
    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        container.innerHTML = `
            <p class="error">Не удалось загрузить услуги. Пожалуйста, попробуйте позже.</p>
            <p>Техническая информация: ${error.message}</p>
        `;
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

let selectedService = null;
let selectedSlot = null;
let selectedMaster = null;

// Function to show booking page
function showBookingPage(service) {
    selectedService = service;
    
    document.getElementById('services-container').innerHTML = `
        <div class="booking-header">
            <h2>Запись на услугу</h2>
            <p>${service.name}</p>
            <p>${service.price}</p>
        </div>
        <div id="calendar-container"></div>
        <div id="time-slots-container" style="display:none;"></div>
        <div id="masters-container" style="display:none;"></div>
        <div id="comment-container" style="display:none;">
            <textarea id="booking-comment" placeholder="Комментарий к записи"></textarea>
            <button id="confirm-booking">Подтвердить запись</button>
        </div>
    `;
    
    loadCalendar();
    
    // Show back button
    const tg = window.Telegram.WebApp;
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
        tg.BackButton.hide();
        loadServices(); // Return to services list
    });
}

// Function to load calendar
async function loadCalendar() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = '<div class="loader">Загрузка календаря...</div>';
    
    try {
        const response = await fetch(`/.netlify/functions/getcalendar?duration=${selectedService.duration}`);
        const data = await response.json();
        renderCalendar(data.dates);
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки календаря</p>';
    }
}

// Function to render calendar
function renderCalendar(dates) {
    const container = document.getElementById('calendar-container');
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
    
    // Add click handlers
    document.querySelectorAll('.date-cell.available').forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.getAttribute('data-date');
            loadTimeSlots(date);
        });
    });
}

// Function to load time slots
async function loadTimeSlots(date) {
    const container = document.getElementById('time-slots-container');
    container.style.display = 'block';
    container.innerHTML = '<div class="loader">Загрузка доступных слотов...</div>';
    
    try {
        const response = await fetch(`/.netlify/functions/gettimeslots?date=${date}&duration=${selectedService.duration}`);
        const data = await response.json();
        renderTimeSlots(data.slots);
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки слотов</p>';
    }
}

// Function to render time slots
function renderTimeSlots(slots) {
    const container = document.getElementById('time-slots-container');
    let html = '<h3>Выберите время:</h3><div class="time-slots-grid">';
    
    slots.forEach(slot => {
        html += `
            <button class="time-slot" data-slot-id="${slot.id_slot}" data-master-id="${slot.id_master}">
                ${slot.start_time}
            </button>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add click handlers
    document.querySelectorAll('.time-slot').forEach(button => {
        button.addEventListener('click', () => {
            selectedSlot = button.getAttribute('data-slot-id');
            selectedMaster = button.getAttribute('data-master-id');
            document.getElementById('masters-container').style.display = 'block';
            document.getElementById('comment-container').style.display = 'block';
            
            // Load master info
            loadMasterInfo(selectedMaster);
        });
    });
}

// Function to load master info
async function loadMasterInfo(masterId) {
    const container = document.getElementById('masters-container');
    container.innerHTML = '<div class="loader">Загрузка информации о мастере...</div>';
    
    try {
        const response = await fetch(`/.netlify/functions/getmaster?id=${masterId}`);
        const data = await response.json();
        renderMasterInfo(data);
    } catch (error) {
        container.innerHTML = '<p class="error">Ошибка загрузки информации</p>';
    }
}

// Function to render master info
function renderMasterInfo(master) {
    const container = document.getElementById('masters-container');
    container.innerHTML = `
        <div class="master-card">
            <h3>Мастер: ${master.name_master}</h3>
        </div>
    `;
    
    // Add confirm button handler
    document.getElementById('confirm-booking').addEventListener('click', confirmBooking);
}

// Function to confirm booking
async function confirmBooking() {
    const comment = document.getElementById('booking-comment').value;
    const tg = window.Telegram.WebApp;
    
    try {
        const response = await fetch('/.netlify/functions/createbooking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: tg.initDataUnsafe.user.id,
                service_id: selectedService.id_service,
                slot_id: selectedSlot,
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
        alert(error.message);
    }
}

// Function to show confirmation
function showConfirmation(booking) {
    document.getElementById('services-container').innerHTML = `
        <div class="confirmation">
            <h2>Запись подтверждена!</h2>
            <p>Услуга: ${selectedService.name}</p>
            <p>Дата: ${booking.date}</p>
            <p>Время: ${booking.time}</p>
            <p>Мастер: ${booking.master}</p>
            <p>Комментарий: ${booking.comment || 'нет'}</p>
        </div>
    `;
    
    // Send confirmation to Telegram
    const tg = window.Telegram.WebApp;
    tg.sendData(JSON.stringify({
        type: 'booking_confirmation',
        details: booking
    }));
    
    // Hide back button
    tg.BackButton.hide();
}

// Update service item click handler in renderCatalog function
function renderCatalog(categoryId, catalog) {
    // ... existing code ...
    
    items.forEach(item => {
        html += `
            <div class="service-item" data-service='${JSON.stringify({
                id: item.id_service,
                name: item.name,
                price: item.price,
                duration: item.duration_minutes
            })}'>
                <span class="service-bullet">✦</span>
                <span class="service-name">${item.name}</span>
                <span class="service-price">${item.price}</span>
            </div>
        `;
    });
    
    // ... existing code ...
    
    // Add click handlers to service items
    document.querySelectorAll('.service-item').forEach(item => {
        item.addEventListener('click', () => {
            const service = JSON.parse(item.getAttribute('data-service'));
            showBookingPage(service);
        });
    });
}
