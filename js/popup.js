export default class Popup {
  SHOW_TIME = 5000;
  popupWrapper = document.getElementsByClassName('popup__wrapper')[0];
  title = document.getElementsByClassName('popup__title')[0];
  text = document.getElementsByClassName('popup__text')[0];
  close = document.getElementsByClassName('popup__close');

  constructor() {
    Array.from(this.close).forEach(el => el.addEventListener('click', this.onClose.bind(this)));
  }

  onOpen() {
    this.popupWrapper.style.display = 'flex';
  }
  onClose() {
    this.popupWrapper.style.display = 'none';
  }
  setTitle(str = '') {
    this.title.textContent = str;
  }
  setText(str = '') {
    this.text.textContent = str;
  }
  onOpenTimeless () {
    this.onOpen();
    setTimeout(this.onClose.bind(this), this.SHOW_TIME);
  }
}

