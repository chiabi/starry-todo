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
  projectContent: document.querySelector('#project-content').content,
  projectItem: document.querySelector('#project-item').content,
  taskItem: document.querySelector('#task-item').content,
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
        const message = `Network error please try again later`
        notification(message, notificationEl, 'is-primary')
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
  const btnLogout = fragment.querySelector('.header__btn-logout')
  const contentEl = fragment.querySelector('.contents');

  btnLogout.addEventListener('click', e => {
    logout()
    loginPage()
  })

  projectContent(contentEl)
  render(fragment)
}

// project content
async function projectContent(parentEl) {
  const fragment = document.importNode(templates.projectContent, true)
  const listEl = fragment.querySelector('.project-list')
  const formEl = fragment.querySelector('.project-write-form')
  const btnAddEl = formEl.querySelector('.projects__btn-add-project')
  const inputEl = formEl.querySelector('.project-write-form__input')

  btnAddEl.addEventListener('click', e => {
    e.preventDefault()
    formEl.classList.add('project-write-form--writing')
    inputEl.focus()
  })

  async function addProject(el) {
    const payload = {
      title: el.value
    }
    try {
      const res = await starryAPI.post('/projects', payload)
      projectItem(listEl, res.data)
      formEl.classList.remove('project-write-form--writing')
      inputEl.value = ''
    } catch (e) {
      alert('전송실패!')
    }
  }
  
  // inputEl.addEventListener('blur', async e => {
  //   e.preventDefault()
  //   addProject(e.target)
  // })

  inputEl.addEventListener('keyup', async e => {
    e.preventDefault()
    if(e.keyCode === 13) {
      addProject(e.target)
    }
  })

  const res = await starryAPI.get('/projects')
  for (const data of res.data) {
    projectItem(listEl, data)
  }
  render(fragment, parentEl, false)
}

// projects item
async function projectItem(parentEl, {title, id}) {
  const fragment = document.importNode(templates.projectItem, true)
  const listEl = fragment.querySelector('.task-list')
  const btnDeleteEl = fragment.querySelector('.project-item__btn-delete')

  fragment.querySelector('.project-item__title').textContent = title
  const res = await starryAPI.get(`/projects/${id}/tasks`)
  for (const data of res.data) {
    taskItem(listEl, data)
  }
  btnDeleteEl.addEventListener('click', async e => {
    await starryAPI.delete(`/projects/${id}`)
    indexPage()
  })
  
  render(fragment, parentEl, false)
}

// task item
async function taskItem(parentEl, {title, startDate, dueDate, labelId, complete}) {
  const fragment = document.importNode(templates.taskItem, true)
  const titleEl = fragment.querySelector('.task-item__title')
  const checkEl = fragment.querySelector('.task-item__complete-check')
  const dateEl = fragment.querySelector('.task-item__date')
  const labelEl = fragment.querySelector('.task-item__label')

  if(complete) {
    checkEl.setAttribute('checked', '')
  }
  titleEl.textContent = title;
  dateEl.querySelector('.start').textContent = startDate
  dateEl.querySelector('.end').textContent = dueDate

  const res = await starryAPI.get(`/labels/${labelId}`)
  switch (res.data.color) {
    case 'red': 
      labelEl.classList.add('is-danger')
      break
    case 'yellow':
      labelEl.classList.add('is-warning')
      break
    case 'green':
      labelEl.classList.add('is-success')
      break
    case 'blue':
      lableEl.classList.add('is-info')
      break
    default: 
      labelEl.classList.add('is-primary')
      break
  }
  labelEl.textContent = res.data.body

  render(fragment, parentEl, false)
}


const token = localStorage.getItem('token')
if (token) {
  login(token)
  indexPage()
} else {
  loginPage()
}