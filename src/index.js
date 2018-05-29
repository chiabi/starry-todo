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


function projectNotification(message = `Network error please try again later`) {
  const notificationEl = document.querySelector('.project-notification')
  notification(message, notificationEl, 'is-warning')
  setTimeout(() => {
    notificationEl.textContent = ''
  }, 3000)
}

function inputCompleteBlur(el) {
  el.addEventListener('keydown', e => {
    if(e.keyCode === 13) {
      e.preventDefault()
      el.blur()
    }
  })
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

  // POST - project item
  inputCompleteBlur(inputEl)
  inputEl.addEventListener('blur', async e => {
    e.preventDefault()
    const payload = {
      title: e.target.value
    }
    if(payload.title) {
      try {
        const res = await starryAPI.post('/projects', payload)
        projectItem(listEl, res.data)
        formEl.classList.remove('project-write-form--writing')
        inputEl.value = ''
      } catch (e) {
        projectNotification()
      }
    } else {
      formEl.classList.remove('project-write-form--writing')
    }
  })

  const res = await starryAPI.get('/projects')
  for (const data of res.data) {
    // 여기에 await 붙이니까 새로고침시 리스트 뒤죽박죽되는 문제 해결되었음
    await projectItem(listEl, data)
  }
  render(fragment, parentEl, false)
}

// projects item
async function projectItem(parentEl, {title, id}) {
  const fragment = document.importNode(templates.projectItem, true)
  const listEl = fragment.querySelector('.task-list')
  const btnDeleteEl = fragment.querySelector('.project-item__btn-delete')
  const btnAddEl = fragment.querySelector('.project-item__btn-add-task')

  const titleEl = fragment.querySelector('.project-item__title');
  const titleShadowEl = titleEl.querySelector('.project-item__title-shadow')
  const titleInputEl = titleEl.querySelector('.project-item__title-input')

  titleShadowEl.textContent = title
  titleInputEl.value = title

  // GET - render task item
  const res = await starryAPI.get(`/projects/${id}/tasks`)
  for (const data of res.data) {
    taskItem(listEl, data)
  }

  // DELETE - project item
  btnDeleteEl.addEventListener('click', async e => {
    const removeEl = btnDeleteEl.closest('.project-item')
    removeEl.classList.add('project-item--delete')
    try {
      await starryAPI.delete(`/projects/${id}`)
      removeEl.remove()
    } catch(e) {
      projectNotification()
      removeEl.classList.remove('project-item--delete')
    }
  })

  // PATCH - project item
  titleInputEl.addEventListener('keydown', e => {
    titleShadowEl.textContent = e.target.value
  })
  inputCompleteBlur(titleInputEl)
  titleInputEl.addEventListener('blur', async e => {
    const payload = {
      title: e.target.value
    }
    try {
      await starryAPI.patch(`/projects/${id}`, payload)
    } catch(e) {
      titleShadowEl.textContent = title
      titleInputEl.value = title
    }
  })

  // POST - task item
  btnAddEl.addEventListener('click', e => {
    
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