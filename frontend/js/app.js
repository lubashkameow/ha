document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    
    // Инициализация интерфейса
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
        tg.showAlert('Выберите услугу из каталога');
    });
});

async function loadServices() {
    try {
      const response = await fetch('/.netlify/functions/getservices');
      const services = await response.json();
      
      // Отобразите услуги на странице
      const container = document.getElementById('services-container');
      container.innerHTML = services.map(service => `
        <div class="service-card">
          <h3>${service.name_service}</h3>
          <p>Цена: ${service.price} ₽</p>
          <p>Категория: ${service.name_category}</p>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Ошибка:', error);
      document.getElementById('services-container').innerHTML = 
        '<p>Не удалось загрузить услуги</p>';
    }
  }
  
  // Вызовите при загрузке страницы
  document.addEventListener('DOMContentLoaded', () => {
    loadServices();
  });
