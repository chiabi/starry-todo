import axios from 'axios'

const starryAPI = axios.create({
  baseURL: process.env.API_URL
})
const root = document.querySelector('.root')
const templates = {
  login: document.querySelector('#login').content,
  register: document.querySelector('#register').content,
  header: document.querySelector('#header').content,
  notification: document.querySelector('#notification').content,
  index: document.querySelector('#index').content,
}

function render(fragment, parent = root) {
  if(parent === root) {
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

function signSubmit(path, {form, btnSubmit}) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    btnSubmit.classList.add('is-loading')
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
    }
    try {
      const res = await starryAPI.post(path, payload)
      login(res.data.token)
      indexPage()
    } catch (e) {
      const status = e.response ? e.response.status : 500
      btnSubmit.classList.remove('is-loading')
      if (status >= 400 && status < 500) {
        alert('The username or password is not correct')
      } else {
        alert('error')
      }
    }
  })
}

function signLink(btnLink, func) {
  btnLink.addEventListener('click', e => {
    e.preventDefault();
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
  signSubmit('users/login', signForm)
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
  signSubmit('users/register', signForm)
  signLink(btnLink, loginPage)
  render(fragment)
}

// layout header
async function layoutHeader(parent) {
  const fragment = document.importNode(templates.header, true)
  const btnLogout = fragment.querySelector('.header__btn-logout');
  btnLogout.addEventListener('click', e => {
    logout()
    loginPage()
  })
  render(fragment, parent)
}

// indexPage
async function indexPage() {
  const fragment = document.importNode(templates.index, true)
  layoutHeader(fragment)
  render(fragment)
}

const token = localStorage.getItem('token')
if (token) {
  login(token)
  indexPage()
} else {
  loginPage()
}