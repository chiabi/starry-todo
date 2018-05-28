import axios from 'axios'

const starryAPI = axios.create({
  baseURL: process.env.API_URL
})
const root = document.querySelector('.root')
const templates = {
  login: document.querySelector('#login').content,
  register: document.querySelector('#register').content,
  notification: document.querySelector('#notification').content,
  index: document.querySelector('#index').content,
}

function render(fragment, parent = root, clear = true) {
  if(clear) {
    parent.textContent = ''
  }
  parent.appendChild(fragment)
}

function login(token) {
  localStorage.setItem('token', token)
  starryAPI.defaults.headers['Authorization'] = `Bearer ${token}`
}

function logout() {
  localStorage.removeItem('token')
  delete starryAPI.defaults.headers['Authorization']
}

// notification
function notification(message, parentNode, stateClass) {
  const fragment = document.importNode(templates.notification, true);
  const notification = fragment.querySelector('.notification');
  notification.textContent = message
  notification.classList.add(stateClass)
  render(fragment, parentNode)
}

function signSubmit(path, {form, btnSubmit}, failMessage) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    btnSubmit.classList.add('is-loading')
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
    }
    const notificationEl = form.querySelector('.sign-form__notification');
    try {
      const res = await starryAPI.post(path, payload)
      login(res.data.token)
      indexPage()
    } catch (e) {
      const status = e.response ? e.response.status : 500
      btnSubmit.classList.remove('is-loading')
      if (status >= 400 && status < 500) {
        notification(failMessage, notificationEl, 'is-warning')
      } else {
        const message = 'sorry, networking error. please, try again later'
        notification(meassge, notificationEl, 'is-primary')
      }
    }
  })
}

function signLink(btnLink, func) {
  btnLink.addEventListener('click', e => {
    e.preventDefault()
    func()
  })
}

// login page
async function loginPage() {
  const fragment = document.importNode(templates.login, true)
  const signForm = {
    form: fragment.querySelector('.login-form'),
    btnSubmit: fragment.querySelector('.login-form__btn-submit'),
  }
  const btnLink = fragment.querySelector('.login-form__btn-link')
  const message = 'The username or password is not correct'
  signSubmit('users/login', signForm, message)
  signLink(btnLink, registerPage)
  render(fragment)
}

// register page
async function registerPage() {
  const fragment = document.importNode(templates.register, true)
  const signForm = {
    form: fragment.querySelector('.register-form'),
    btnSubmit: fragment.querySelector('.register-form__btn-submit'),
  }
  const btnLink = fragment.querySelector('.register-form__btn-link')
  const message = 'Username already exists'
  signSubmit('users/register', signForm, message)
  signLink(btnLink, loginPage)
  render(fragment)
}

// indexPage
async function indexPage() {
  const fragment = document.importNode(templates.index, true)
  const btnLogout = fragment.querySelector('.header__btn-logout');
  btnLogout.addEventListener('click', e => {
    logout()
    loginPage()
  })
  render(fragment)
}

const token = localStorage.getItem('token')
if (token) {
  login(token)
  indexPage()
} else {
  loginPage()
}