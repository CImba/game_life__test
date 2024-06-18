import Popup from "./popup.js";

const popup = new Popup();

document.getElementsByName('size')[0].addEventListener('keydown', onCheckNumbersAbel);
document.getElementsByName('size')[1].addEventListener('keydown', onCheckNumbersAbel);
document.getElementsByName('size')[0].addEventListener('keyup', onChangeSize);
document.getElementsByName('size')[1].addEventListener('keyup', onChangeSize);

document.getElementsByClassName('place')[0].addEventListener('click', setActiveCell);
document.querySelector('[data-setting-btn = "create-place"]').addEventListener('click', onStart);
document.querySelector('[data-setting-btn = "generation-auto"]').addEventListener('click',
  () => setStartPositions('auto'));
document.querySelector('[data-setting-btn = "generation-mouse"]').addEventListener('click',
  () => setStartPositions('mouse'));
document.querySelector('[data-setting-btn = "play"]').addEventListener('click', onStartLife);
document.querySelector('[data-setting-btn = "pause"]').addEventListener('click', onPauseLife);

const EL_MIN_SIZE = 5;
const EL_MAX_SIZE = 20;
const SIZE_MIN = 3;

let game = {
  listLife: [],
  size: {x: 0, y: 0},
  isCreated: false,
  isLiving: false,
  generatingType: '',
  steps: 0,
  speed: 1000
};
let oldStates = [];

/**
 * Обновление видимости дальнейших шагов
 * @param state Класс для блоков управления
 */
function onUpdateRulesBlocks(state = 'flex') {
  const startBlock = document.getElementById('life-start-block');
  const rulesBlock = document.getElementById('life-rules-block');
  if (startBlock === null || rulesBlock === null) {
    popup.setTitle('Error');
    popup.setText('Rule block not found')
    popup.onOpenTimeless();
    return;
  }
  let activeBtnList = document.getElementsByClassName('btn-active');
  Array.from(activeBtnList).forEach(item => item.classList.remove('btn-active'));
  startBlock.style.display = state;
  rulesBlock.style.display = state;
  let btnList = document.querySelectorAll('[data-setting-btn]');
  btnList.forEach(item => {
      item.removeAttribute('disabled');
  });
}

/**
 * Отрисовка (создание) клеток поля линиями в указанном интервала
 * @param firstIndex Индекс начала интервала
 * @param lastIndex Индекс окончания интервала
 * @param place Объект поля
 * @param widthElement Ширина элемента (клетки)
 * @param needClear Перерисовываем или дорисовываем
 */
function onCreateByLines(firstIndex, lastIndex, place, widthElement, needClear) {
  let htmlElList = [];
  for (let i = firstIndex; i < lastIndex; i++) {
    htmlElList.push(`<div class="line" data-lazy-load="${i}">`);
    for (let j = 0; j < game.size.y; j++) {
      htmlElList.push(
        `
        <span class="place__item"
        data-js="${i}_${j}"
        style="width: ${widthElement}px; height: ${widthElement}px; display: none;">
        </span>
       `
      );
    }
    htmlElList.push(`</div>`);
  }
  place.innerHTML = needClear ? htmlElList.join('') : place.innerHTML + htmlElList.join('');
}
/**
 * Задержка для отрисовки поля блоками (интервалами)
 * @param i Индекс начала интервала
 * @param j Индекс окончания интервала
 * @param place Объект поля
 * @param widthElement Ширина элемента
 */
function delayForCreate(i, j, place, widthElement) {
  const needClear = i === 0;
  setTimeout(function () {onCreateByLines(i, j, place, widthElement, needClear);}, 0);
}
/**
  * Создание поля
 */
function onCreate() {
  const place = document.getElementsByClassName('place')[0];
  const wrapper = document.getElementsByClassName('place__wrapper')[0];
  const count = document.getElementsByClassName('place__info')[0];
  const text = document.getElementsByClassName('place__result')[0];
  if (place === null || wrapper === null || count === null || text === null) {
    setTimeout(onLoading,0);
    popup.setTitle('Error');
    popup.setText('Place or elements not found')
    popup.onOpenTimeless();
    return;
  }
  count.textContent = game.steps;
  text.textContent = '';
  const widthPlace = place.offsetWidth;
  /* размер элемента = ширина поля / количество элементов в строку,
     но <= EL_MAX_SIZE и >= EL_MIN_SIZE
   */
  const widthElement = Math.max(Math.min(Math.round(widthPlace / game.size.x), EL_MAX_SIZE), EL_MIN_SIZE);
  let i = 0;
  let j = 0;
  while (i < game.size.x || j < game.size.x) {
    j = Math.min(game.size.x, i + 500);
    delayForCreate(i, j, place, widthElement);
    i = j;
  }

  if (parseInt(game.size.x) * (widthElement + 5) - 60 > parseInt(wrapper.offsetWidth)) {
    place.style.justifyContent = 'start';
    place.style.overflowX = 'scroll';
  } else {
    place.style.justifyContent = 'center';
    place.style.overflowX = 'hidden';
  }
  game.isCreated = true;
  onUpdateRulesBlocks();
  if (game.listLife.length > 0) {
    onChangeGameState(game.listLife, 'clear');
    game.listLife = [];
  }
  setTimeout(onLazyLoadElements, 0);

}
/**
  * Считывание размеров поля с проверкой значений
 */
function onStart() {
  game.isCreated = false;
  let list = document.querySelectorAll('[data-size]');
  if (list[0] === null || list[1] === null) {
    popup.setTitle('Error');
    popup.setText('Sizes not found')
    popup.onOpenTimeless();
    return;
  }
  if (list[0].value === '' || list[1].value === '') {
    popup.setTitle('Error');
    popup.setText('Size can not be empty')
    popup.onOpenTimeless();
    return;
  }
  if (list[0].value === 0 || list[1].value === 0) {
    popup.setTitle('Error');
    popup.setText('Size can not be 0')
    popup.onOpenTimeless();
    return;
  }
  game.size = {x: list[0].value, y: list[1].value};
  onLoading('show');
  setTimeout(onCreate,0);
}
/**
 * Преобразуем введенные цифры в число ( 090 -> 90 )
 */
function onChangeSize() {
  this.value = Math.max(Math.abs(Number(this.value)), SIZE_MIN);
}
/**
 * Запрещаем ввод не-цифр (-, +, пробел, знаки препинания, e)
 */
function onCheckNumbersAbel(event) {
  if (event.key === '-' || event.key === '+' || event.key === ' ') {
    event.preventDefault();
  }
  if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E') {
    event.preventDefault();
  }
}
/**
 * Установка значения элемента поля по клику
 * возможна только при соответствующем флаге
 * @param event Событие клика по ячейке
 */
function setActiveCell(event) {
  if (game.generatingType !== 'mouse') {
    return;
  }
  let cell = event.target;
  if (cell.classList[0] !== 'place__item') {
    // miss click
    return;
  }
  if (cell.classList.length === 2) {
    cell.classList.remove('place__item--life');
    game.listLife = game.listLife.filter(item => item !== cell.getAttribute('data-js'));
  } else {
    cell.classList.add('place__item--life');
    game.listLife.push(cell.getAttribute('data-js'));
  }
}
/**
 * Запуск игры
 */
function onStartLife() {
  if (game.steps === 0 && game.listLife.length < 1) {
    popup.setTitle('Error');
    popup.setText('First state is empty')
    popup.onOpenTimeless();
    return;
  }
  let btnList = document.querySelectorAll('[data-setting-btn]');
  btnList.forEach(item => {
    if (item.getAttribute('data-setting-btn') !== 'pause') {
      item.setAttribute('disabled', '');
    }
  });
  game.isLiving = true;
  setTimeout(stepOnLife,0);
}
/**
 * Пауза и возобновление игры
 */
function onPauseLife() {
  game.isLiving = !game.isLiving;
  if (game.isLiving)
    onStartLife();
}
/**
 * Установка стартового состояния поля
 * @param type Тип (формат) установки начальной позиции для игры
 */
function setStartPositions(type = '') {
  switch (type) {
    case '': {
      popup.setTitle('Error');
      popup.setText('Something wrong!')
      popup.onOpenTimeless();
      break;
    }
    case 'mouse': {
      game.generatingType = 'mouse';
      document.getElementsByName('set-first-state')[0].classList.add('btn-active');
      break;
    }
    case 'auto': {
      game.generatingType = 'auto';
      document.getElementsByName('set-first-state')[0].classList.remove('btn-active');
      onLoading('show');
      setTimeout(onGeneratingStartPositionsAuto, 0);
      setTimeout(onLoading, 0);
      break;
    }
    default: {
      popup.setTitle('Error');
      popup.setText('Something wrong!')
      popup.onOpenTimeless();
      break;
    }
  }
}
/**
 * Рандомный выбор точек и установка их как начальных для игры
 */
function onGeneratingStartPositionsAuto() {
  if (game.listLife.length > 0) {
    onChangeGameState(game.listLife, 'clear');
    game.listLife = [];
  }
  const elements = Math.max(parseInt(game.size.x) + 1, parseInt(game.size.y) + 1);
  let tmp = '';
  for (let i = 0; i < elements; i++) {
    tmp = Math.floor(Math.random() * game.size.x) + '_' + Math.floor(Math.random() * game.size.y);
    game.listLife.push(tmp);
  }
  onChangeGameState(game.listLife,'add');
}
/**
 * Изменение игрового поля
 * @param gameItemActiveList Массив активных точек (живых клеток)
 * @param type Тип изменений
 */
function onChangeGameState(gameItemActiveList, type) {
  let gameItemList = document.querySelectorAll('[data-js]');
  gameItemList.forEach((item) => {
    if(gameItemActiveList.find((el) => item.getAttribute('data-js') === el)) {
      //item.classList.add('place__item--life');
      if (type === 'add') {
        item.classList.add('place__item--life');
      } else {
        item.classList.remove('place__item--life');
      }
    }
  });
}
/**
 * Новый цикл игры
 */
function stepOnLife() {
  const start = performance.now();
  if (game.isLiving === false) {
    return;
  }
  game.steps++;
  document.getElementsByClassName('place__info')[0].innerText = game.steps;
  let tmpArr = [];
  game.listLife.forEach(item => {
    onCheckNeighbors(tmpArr, item.split('_')[0], item.split('_')[1]);
  });
  let newState = [];
  tmpArr.forEach(item => {
    if (item.val === 3 || (item.val === 4 && isWasLife(item.name))) {
      newState.push(item.name);
    }
  });
  oldStates.push(game.listLife);
  onChangeGameState(game.listLife,'clear');
  game.listLife = [];
  game.listLife = newState;
  onChangeGameState(game.listLife,'add');
  if (isEndOfGame()) {
    game.isLiving = false;
    onUpdateRulesBlocks('none');
    const text = game.listLife.length < 1 ? 'Все колонии погибли' : 'Конфигурация колоний устойчива (циклична или неизменна)';
    addStrOnPlace(text);
  } else {
    setTimeout(stepOnLife, game.speed);
  }
  const end = performance.now();
  console.info(`${game.steps}) Execution time: ${end - start} ms`);
}
/**
 * Установка значений в живых клетках и клетках-соседях к ним
 */
function onCheckNeighbors(arr, x, y) {
  let upX = (parseInt(x) + 1 === parseInt(game.size.x)) ? 0 : parseInt(x) + 1;
  let upY = (parseInt(y) + 1 === parseInt(game.size.y)) ? 0 : parseInt(y) + 1;
  let downX = (parseInt(x) === 0) ? parseInt(game.size.x) - 1 : parseInt(x) - 1;
  let downY = (parseInt(y) === 0) ? parseInt(game.size.y) - 1 : parseInt(y) - 1;

  let str = x + '_' + y;
  let strR = x + '_' + upY;
  let strL = x + '_' + downY;
  checkAndChangeArr(arr, str);
  checkAndChangeArr(arr, strR);
  checkAndChangeArr(arr, strL);

  str = upX + '_' + y;
  strR = upX + '_' + upY;
  strL = upX + '_' + downY;
  checkAndChangeArr(arr, str);
  checkAndChangeArr(arr, strR);
  checkAndChangeArr(arr, strL);

  str = downX + '_' + y;
  strR = downX + '_' + upY;
  strL = downX + '_' + downY;
  checkAndChangeArr(arr, str);
  checkAndChangeArr(arr, strR);
  checkAndChangeArr(arr, strL);
}
/**
 * Изменение состояния вспомогательного массива
 * @param arr Изменяемый массив
 * @param name Имя проверяемой/изменяемой клетки
 */
function checkAndChangeArr(arr, name) {
  let find = false;
  arr.forEach(item => {
    if (item.name === name) {
      item.val += 1;
      find = true;
    }
  });
  if (find === false) {
    arr.push({
      name: name,
      val: 1
    });
  }
}
/**
 * Проверка клетки на "Жизнь" в предыдущем (текущем) цикле
 * @param name Имя проверяемой клетки
 */
function isWasLife(name) {
  let answer = false;
  game.listLife.forEach(item => {
    if (item === name) {
      answer = true;
      return;
    }
  });
  return answer;
}

/**
 * Проверка на прекращение игры
 * условия завершения:
 * 1) на поле нет "живых" клеток
 * 2) конфигурация повторилась
 */
function isEndOfGame() {
  if (game.listLife.length < 1)
    return true;
  if (game.listLife.length < 3)
    return false; // the end is near
  let answer = false;
  oldStates.forEach(state => {
    if (isEqualArrays(state, game.listLife)) {
      answer = true;
      return;
    }
  });
  return answer;
}

/**
 * Сравнение двух массивов на равенство
 * @param arr1 Один массив
 * @param arr2 Другой массив
 */
function isEqualArrays(arr1, arr2) {
  if (arr1.length !== arr2.length)
    return false;
  let res = 0;
  let find;
  arr1.forEach(item => {
    find = false;
    arr2.forEach(el => {
      if (el === item) {
        find = true;
        return;
      }
    });
    if (find) {
      res++;
    } else {
      return;
    }
  });
  return res === arr1.length;
}

/**
 * Выводим сообщение о причине завершения игры на поле
 */
function addStrOnPlace(text) {
  document.getElementsByClassName('place__result')[0].textContent = text;
}

/**
 * Показывать/скрывать заглушку загрузки
 * @param type Статус заглушки
 */
function onLoading(type) {
  const loader = document.getElementsByClassName('loading__wrapper')[0];
  if (loader === null) {
    popup.setTitle('Error');
    popup.setText('Something wrong!')
    popup.onOpenTimeless();
    return;
  }
  switch (type) {
    case 'show': {
      loader.style.display = 'flex';
      break;
    }
    case 'hide': {
      loader.style.display = 'none';
      break;
    }
    default: {
      loader.style.display = 'none';
      break;
    }
  }
}

/**
 * Откладываем отрисовку элементов с помощью вызова отрисовки каждого столбца
 */
function onLazyLoadElements() {
  for (let i = 0; i < game.size.x; i++) {
    setTimeout(function() {onShowElementsLine(i);}, 0);
  }
  setTimeout(onLoading,0);
}

/**
 * Отрисовка (показываем на экране) клеток по столбцам
 * @param idLine Номер столбца
 */
function onShowElementsLine(idLine) {
  let line = document.querySelector(`[data-lazy-load='${idLine}']`);
  if (line === null) {
    return;
  }
  let list = line.getElementsByClassName('place__item');
  Array.from(list).forEach(item => item.style.display = 'block');
}
