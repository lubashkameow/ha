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
});

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
    
    let html = '<div class="services-view">';
    
    // Отображаем оба каталога
    for (const [category, services] of Object.entries(data.catalog)) {
        html += `<h2 class="catalog-title">${category}</h2>`;
        
        for (const [subcategory, items] of Object.entries(services)) {
            html += `<h3 class="subcategory-title">${subcategory}</h3>`;
            html += '<ul class="services-list">';
            
            items.forEach(item => {
                html += `
                    <li class="service-item">
                        <span class="service-name">${item.name}</span>
                        <span class="service-price">${item.price}</span>
                    </li>
                `;
            });
            
            html += '</ul>';
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Показать форму записи
function showBookingForm() {
    const formContainer = document.getElementById('booking-form-container');
    
    if (formContainer) {
        formContainer.style.display = 'block';
        return;
    }
    
    // Создаем форму записи
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
            <div id="calendar-container"></div>
        </div>
        
        <div class="form-step" id="step-time" style="display:none;">
            <label>Выберите время:</label>
            <div id="time-slots-container"></div>
        </div>
        
        <div class="form-step" id="step-comment" style="display:none;">
            <label>Комментарий (необязательно):</label>
            <textarea id="booking-comment" class="form-control" placeholder="Ваши пожелания..."></textarea>
        </div>
        
        <div class="form-navigation">
            <button id="prev-btn" class="nav-btn" disabled>Назад</button>
            <button id="next-btn" class="nav-btn">Далее</button>
        </div>
    </div>
    `;
    
    document.querySelector('.main-content').insertAdjacentHTML('beforeend', formHtml);
    
    // Инициализация обработчиков формы
    initBookingForm();
}

// Инициализация формы записи
function initBookingForm() {
    const catalogSelect = document.getElementById('catalog-select');
    const serviceSelect = document.getElementById('service-select');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let currentStep = 1;
    const totalSteps = 5;
    let selectedService = null;
    let selectedSlot = null;
    
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
            serviceSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    });
    
    // Обработчик кнопки "Далее"
    nextBtn.addEventListener('click', async function() {
        if (currentStep >= totalSteps) {
            await confirmBooking();
            return;
        }
        
        if (!validateCurrentStep()) {
            return;
        }
        
        // Подготовка данных для следующего шага
        if (currentStep === 2) { // После выбора услуги
            selectedService = JSON.parse(serviceSelect.value);
        }
        
        currentStep++;
        updateFormView();
        
        // Загрузка данных для шага
        if (currentStep === 3) { // Шаг выбора даты
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
                if (!document.querySelector('.date-cell.selected')) {
                    alert('Пожалуйста, выберите дату');
                    return false;
                }
                return true;
                
            case 4: // Время
                if (!document.querySelector('.time-slot.selected')) {
                    alert('Пожалуйста, выберите время');
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
    }
    
    // Получение имени шага
    function getStepName(step) {
        switch(step) {
            case 1: return 'catalog';
            case 2: return 'service';
            case 3: return 'date';
            case 4: return 'time';
            case 5: return 'comment';
            default: return '';
        }
    }
    
    // Загрузка доступных дат
    async function loadAvailableDates(service) {
        const container = document.getElementById('calendar-container');
        container.innerHTML = '<div class="loader">Загрузка дат...</div>';
        
        try {
            const response = await fetch(`/.netlify/functions/getcalendar?duration=${service.duration}`);
            const data = await response.json();
            renderCalendar(data.dates);
        } catch (error) {
            container.innerHTML = '<p class="error">Ошибка загрузки дат</p>';
        }
    }
    
    // Отрисовка календаря
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
        
        // Обработчики выбора даты
        document.querySelectorAll('.date-cell.available').forEach(cell => {
            cell.addEventListener('click', function() {
                document.querySelectorAll('.date-cell').forEach(c => {
                    c.classList.remove('selected');
                });
                this.classList.add('selected');
                
                const date = this.getAttribute('data-date');
                loadTimeSlots(date, selectedService.duration);
            });
        });
    }
    
    // Загрузка временных слотов
    async function loadTimeSlots(date, duration) {
        const container = document.getElementById('time-slots-container');
        container.innerHTML = '<div class="loader">Загрузка времени...</div>';
        
        try {
            const response = await fetch(`/.netlify/functions/gettimeslots?date=${date}&duration=${duration}`);
            const data = await response.json();
            renderTimeSlots(data.slots);
        } catch (error) {
            container.innerHTML = '<p class="error">Ошибка загрузки времени</p>';
        }
    }
    
    // Отрисовка временных слотов
    function renderTimeSlots(slots) {
        const container = document.getElementById('time-slots-container');
        let html = '<div class="time-slots-grid">';
        
        slots.forEach(slot => {
            html += `
                <button class="time-slot" 
                        data-slot-id="${slot.id_slot}"
                        data-master-id="${slot.id_master}"
                        data-master-name="${slot.name_master}">
                    ${slot.start_time}
                </button>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Обработчики выбора времени
        document.querySelectorAll('.time-slot').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.time-slot').forEach(b => {
                    b.classList.remove('selected');
                });
                this.classList.add('selected');
                selectedSlot = this.getAttribute('data-slot-id');
            });
        });
    }
    
    // Подтверждение записи
    async function confirmBooking() {
        const tg = window.Telegram.WebApp;
        const comment = document.getElementById('booking-comment').value;
        const timeSlot = document.querySelector('.time-slot.selected');
        
        if (!selectedService || !selectedSlot) {
            alert('Пожалуйста, заполните все обязательные поля');
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
                    master_id: timeSlot.getAttribute('data-master-id'),
                    master_name: timeSlot.getAttribute('data-master-name'),
                    date: document.querySelector('.date-cell.selected').getAttribute('data-date'),
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
            alert(error.message);
        }
    }
    
    // Показать подтверждение записи
    function showConfirmation(booking) {
        const formContainer = document.getElementById('booking-form-container');
        formContainer.innerHTML = `
            <div class="confirmation">
                <h3>Запись подтверждена!</h3>
                <p><strong>Услуга:</strong> ${booking.service_name} (${booking.service_price})</p>
                <p><strong>Дата:</strong> ${booking.date}</p>
                <p><strong>Время:</strong> ${booking.time}</p>
                <p><strong>Мастер:</strong> ${booking.master_name}</p>
                ${booking.comment ? `<p><strong>Комментарий:</strong> ${booking.comment}</p>` : ''}
                <button id="close-booking" class="btn-primary">Закрыть</button>
            </div>
        `;
        
        document.getElementById('close-booking').addEventListener('click', () => {
            formContainer.style.display = 'none';
        });
    }
}
