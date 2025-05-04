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
    
    document.getElementById('close-portfolio-modal').addEventListener('click', () => {
    document.getElementById('portfolio-modal').classList.add('hidden');
});
});

let selectedDate = null;
let selectedService = null;
let selectedSlot = null;
let selectedMaster = null;

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
    <h3>Запись на услугу</h3>
    
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
    document.querySelector('.main-content').insertAdjacentHTML('beforeend', formHtml);
    
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
                        duration: item.duration_minutes
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
            
            // Добавим проверку структуры
            if (!selectedService.id || !selectedService.name) {
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
    const container = document.getElementById('week-days-container'); // Изменили здесь
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
        
    let html = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        // Пропускаем прошедшие даты
        if (date < today) continue;
        
        const day = date.getDate();
        const weekDay = weekDays[date.getDay()];
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === new Date().toDateString();
        
        html += `
            <div class="day-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="week-day">${weekDay}</div>
                <div class="day-number">${day}</div>
            </div>
        `;
    }
    
    container.innerHTML = html || '<p>Нет доступных дат</p>';
    updateWeekRangeText(startDate);
    
    // Обработчики клика по дням
    document.querySelectorAll('.day-cell').forEach(cell => {
    cell.addEventListener('click', function() {
        document.querySelectorAll('.day-cell').forEach(c => {
            c.classList.remove('selected');
        });
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
async function loadMastersSlots(date, duration) {
    const container = document.getElementById('masters-slots-container');
    container.innerHTML = '<div class="loader">Загрузка мастеров...</div>';

    try {
        const mastersResponse = await fetch(`/.netlify/functions/getmaster?date=${date}`);
        const mastersData = await mastersResponse.json();

        let html = '';
        for (const master of mastersData.masters) {
            const slotsResponse = await fetch(
                `/.netlify/functions/gettimeslots?date=${date}&master_id=${master.id_master}&duration=${duration}`
            );
            const slotsData = await slotsResponse.json();

            if (slotsData.slots.length > 0) {
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
            }
        }

        container.innerHTML = html || '<p>Нет доступных мастеров на эту дату</p>';

        // Обработчики выбора времени
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
                <span class="summary-label">Услуга:</span>
                <span class="summary-value">${selectedService.name} (${selectedService.price})</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Дата:</span>
                <span class="summary-value">${formatDate(selectedDate)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Время:</span>
                <span class="summary-value">${timeSlot.textContent}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Мастер:</span>
                <span class="summary-value">${selectedMaster.name || 'не выбран'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Комментарий:</span>
                <span class="summary-value">${document.getElementById('booking-comment').value || 'нет'}</span>
            </div>
        </div>
    `;
}

// Добавьте функцию форматирования даты
function formatDate(dateStr) {
    const date = new Date(dateStr);
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

    try {
        const response = await fetch('/.netlify/functions/createbooking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: tg.initDataUnsafe.user.id,
                service_id: selectedService.id,
                service_name: selectedService.name,
                service_price: selectedService.price,
                slot_id: selectedSlot,
                master_id: selectedMaster.id,
                master_name: selectedMaster.name,
                date: selectedDate,
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
            <h2>🎉 Ура! Вы успешно записались!</h2>
            <div class="confirmation-details">
                <p><strong>💇 Услуга:</strong> ${booking.name_service} (${booking.price} ₽)</p>
                <p><strong>📅 Дата:</strong> ${booking.date}</p>
                <p><strong>⏰ Время:</strong> ${booking.time}</p>
                <p><strong>👩‍🎨 Мастер:</strong> ${booking.name_master}</p>
                <p><strong>📝 Комментарий:</strong> ${booking.comment || 'нет'}</p>
            </div>
            <button id="close-booking" class="btn-primary">Закрыть</button>
        </div>
    `;

    document.getElementById('close-booking').addEventListener('click', () => {
        formContainer.style.display = 'none';
    });
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
        
        // Загружаем данные при необходимости
        if (pageId === 'bookings') {
            loadUserBookings();
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
                        <div class="booking-service">${booking.service_name}</div>
                        <div class="booking-date">${booking.date} в ${booking.time}</div>
                        <div class="booking-master">Мастер: ${booking.master_name}</div>
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

async function displayMasterInfo(master) {
    const container = document.getElementById('master-info');
    container.innerHTML = `
        <div class="master-card">
            <img src="img/default-master.jpg" alt="${master.name_master}">
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
            grid.innerHTML = data.photos.map(photo => `
                <img src="${photo}" class="portfolio-photo">
            `).join('');
            // Навешиваем обработчики клика по фото
            grid.querySelectorAll('.portfolio-photo').forEach(img => {
                img.addEventListener('click', () => {
                    const modal = document.getElementById('portfolio-modal');
                    const modalImg = document.getElementById('modal-photo');
                    const modalDesc = document.getElementById('modal-description');

                    modalImg.src = img.src;
                    modalDesc.textContent = img.dataset.description;
                    modal.classList.remove('hidden');
                });
            });
        } else {
            grid.innerHTML = '<p>Портфолио пока пусто</p>';
        }
    } catch (err) {
        container.querySelector('.portfolio-grid').innerHTML = '<p class="error">Ошибка загрузки портфолио</p>';
    }
}

function showPortfolioModal(photos) {
  const portfolioGrid = document.getElementById('portfolio-photos');
  portfolioGrid.innerHTML = '';

  photos.forEach(photo => {
    const div = document.createElement('div');
    div.className = 'portfolio-photo-wrapper';

    const img = document.createElement('img');
    img.className = 'portfolio-photo';
    img.src = photo.photo;
    img.alt = 'Работа мастера';
    img.addEventListener('click', () => {
      document.getElementById('modal-photo').src = photo.photo;
      document.getElementById('modal-description').textContent = photo.description_photo || 'Описание отсутствует';
      document.getElementById('portfolio-modal').classList.remove('hidden');
    });

    div.appendChild(img);
    portfolioGrid.appendChild(div);
  });

  // Закрытие модального окна
  document.getElementById('close-portfolio-modal').onclick = () => {
    document.getElementById('portfolio-modal').classList.add('hidden');
  };
}





