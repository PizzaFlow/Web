let center = [55.81045765383959, 37.4982378712605];
let map, placemark;

// Функция debounce для ограничения частоты запросов
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function init() {
  try {
    map = new ymaps.Map('map', {
      center: center,
      zoom: 19
    });

    window.map = map; // Делаем map доступным глобально для переключения темы

    placemark = new ymaps.Placemark(center, {}, {
      iconLayout: 'default#image',
      iconImageHref: 'https://cdn-icons-png.flaticon.com/128/5425/5425869.png',
      iconImageSize: [40, 40],
      iconImageOffset: [-15, -10]
    });

    map.controls.remove('geolocationControl'); // удаляем геолокацию
    map.controls.remove('searchControl'); // удаляем поиск
    map.controls.remove('trafficControl'); // удаляем контроль трафика
    map.controls.remove('typeSelector'); // удаляем тип
    map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим
    map.controls.remove('zoomControl'); // удаляем контрол зуммирования
    map.controls.remove('rulerControl'); // удаляем контрол правил

    map.geoObjects.add(placemark);

    // Кастомный поиск
    let searchInput = document.getElementById('searchInput');
    let searchResults = document.getElementById('searchResults');

    const debouncedSearch = debounce(function (query) {
      if (query.length < 3) {
        searchResults.innerHTML = '';
        return;
      }

      ymaps.geocode(query).then(function (res) {
        let geoObjects = res.geoObjects;
        searchResults.innerHTML = '';
        geoObjects.each(function (geoObject) {
          let resultDiv = document.createElement('div');
          resultDiv.textContent = geoObject.getAddressLine();
          resultDiv.addEventListener('click', function () {
            let coords = geoObject.geometry.getCoordinates();
            map.panTo(coords, { duration: 1000, timingFunction: 'ease-in-out' }).then(() => {
              map.setZoom(15);
            });
            map.geoObjects.remove(placemark);
            placemark = new ymaps.Placemark(coords, {
              balloonContent: geoObject.getAddressLine()
            }, {
              iconLayout: 'default#image',
              iconImageHref: 'https://cdn-icons-png.flaticon.com/128/5425/5425869.png',
              iconImageSize: [40, 40],
              iconImageOffset: [-15, -10]
            });
            map.geoObjects.add(placemark);
            placemark.balloon.open();
            searchResults.innerHTML = '';
            searchInput.value = '';
          });
          searchResults.appendChild(resultDiv);
        });
      }, function (err) {
        console.error('Ошибка геокодирования:', err);
      });
    }, 300);

    searchInput.addEventListener('input', function (e) {
      debouncedSearch(e.target.value);
    });

    console.log('Карта успешно инициализирована');

    // Попробуем применить тему после инициализации карты
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    updateMapTheme(savedTheme);
  } catch (error) {
    console.error('Ошибка при инициализации карты:', error);
    document.getElementById('map').innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Не удалось загрузить карту. Проверьте подключение к интернету или API ключ.</div>';
  }
}

ymaps.ready(init);

// Функция для изменения типа карты
function updateMapTheme(theme) {
  if (window.map && typeof window.map.setType === 'function') {
    try {
      window.map.setType(theme === 'dark' ? 'yandex#dark' : 'yandex#map');
    } catch (error) {
      console.warn('Не удалось изменить тип карты:', error);
      // Если смена типа не поддерживается, можно применить CSS-фильтр
      const mapContainer = document.getElementById('map');
      if (theme === 'dark') {
        mapContainer.style.filter = 'invert(90%) hue-rotate(180deg)';
      } else {
        mapContainer.style.filter = 'none';
      }
    }
  } else {
    console.warn('Метод setType недоступен. Карта не поддерживает смену темы.');
  }
}