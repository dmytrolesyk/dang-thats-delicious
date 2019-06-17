import axios from 'axios';
import { $ } from './bling';
export default async function(e) {
  e.preventDefault();
  const res = await axios.post(this.action);
  const isHearted = this.heart.classList.toggle('heart__button--hearted');
  $('.heart-count').textContent = res.data.hearts.length;
  if(isHearted) {
    this.heart.classList.add('heart__button--float');
    setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
  } else if(!isHearted && window.location.pathname === '/hearts') {
    window.location.reload();
  }
};