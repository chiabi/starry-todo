import axios from 'axios'
import moment from 'moment'

const starryAPI = axios.create({
  baseURL: process.env.API_URL
})

const body = document.querySelector('body')
const root = document.querySelector('.root')

const templates = {
  login:          document.querySelector('#login').content,
  register:       document.querySelector('#register').content,
  notification:   document.querySelector('#notification').content,
  loading:        document.querySelector('#loading').content,
  index:          document.querySelector('#index').content,
  projectContent: document.querySelector('#project-content').content,
  projectItem:    document.querySelector('#project-item').content,
  taskItem:       document.querySelector('#task-item').content,
  taskLabel:       document.querySelector('#task-label').content,
  taskWriteModal: document.querySelector('#task-write-modal').content,
}

function deepCopyFragment(template) {
  return document.importNode(template, true)
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

// Notification Component
function notification(message, parentNode, stateClass) {
  const fragment = document.importNode(templates.notification, true);
  const notification = fragment.querySelector('.notification');
  
  notification.textContent = message
  notification.classList.add(stateClass)
  render(fragment, parentNode)
}

// Sign Submit Button Event
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

// Sign Link Button Event
function signLink(btnLink, func) {
  btnLink.addEventListener('click', e => {
    e.preventDefault()
    func()
  })
}

// Login Page
async function loginPage() {
  const fragment = deepCopyFragment(templates.login)
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

// Register Page
async function registerPage() {
  const fragment = deepCopyFragment(templates.register)
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

// Loading Component
async function withlLoading(promise, parentEl = body) {
  const fragment = deepCopyFragment(templates.loading)
  const el = fragment.querySelector('.loading')
  render(fragment, parentEl, false)
  const value = await promise
  el.remove()
  return value
}

// Index Page
async function indexPage() {
  const fragment = deepCopyFragment(templates.index)
  const btnLogout = fragment.querySelector('.header__btn-logout')
  const contentEl = fragment.querySelector('.contents');

  btnLogout.addEventListener('click', e => {
    logout()
    loginPage()
  })
  withlLoading(projectContent(contentEl))
  render(fragment)
}

// Project Notification Component
function projectNotification(message = `Network error please try again later`) {
  const notificationEl = document.querySelector('.project-notification')
  notification(message, notificationEl, 'is-warning')
  setTimeout(() => {
    notificationEl.textContent = ''
  }, 3000)
}

// Form Element Blur
function inputCompleteBlur(el) {
  el.addEventListener('keydown', e => {
    if(e.keyCode === 13) {
      e.preventDefault()
      el.blur()
    }
  })
}

// Project Content Component
async function projectContent(parentEl) {
  const fragment = deepCopyFragment(templates.projectContent)
  const listEl = fragment.querySelector('.project-list')
  const formEl = fragment.querySelector('.project-write-form')
  const btnAddEl = formEl.querySelector('.projects__btn-add-project')
  const inputEl = formEl.querySelector('.project-write-form__input')

  btnAddEl.addEventListener('click', e => {
    e.preventDefault()
    formEl.classList.add('project-write-form--writing')
    inputEl.focus()
  })

  // [POST] - project item
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

// Project Item Component
async function projectItem(parentEl, {title, id}) {
  const fragment = deepCopyFragment(templates.projectItem)
  const listEl = fragment.querySelector('.task-list')
  const btnDeleteEl = fragment.querySelector('.project-item__btn-delete')
  const btnAddEl = fragment.querySelector('.project-item__btn-add-task')

  const titleEl = fragment.querySelector('.project-item__title');
  const titleShadowEl = titleEl.querySelector('.project-item__title-shadow')
  const titleInputEl = titleEl.querySelector('.project-item__title-input')

  titleShadowEl.textContent = title
  titleInputEl.value = title

  // [GET] - render task item
  const res = await starryAPI.get(`/projects/${id}/tasks`)
  for (const data of res.data) {
    taskItem(listEl, data)
  }

  // [DELETE] - project item
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

  // [PATCH] - project item
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

  btnAddEl.addEventListener('click', e => {
    taskWriteModal(listEl, id)
  })
  
  render(fragment, parentEl, false)
}

// Task Item Component
async function taskItem(parentEl, {title, startDate, dueDate, labelId, complete, id}) {
  const fragment = deepCopyFragment(templates.taskItem)
  const titleEl = fragment.querySelector('.task-item__title')
  const checkEl = fragment.querySelector('.task-item__complete-check')
  const dateEl = fragment.querySelector('.task-item__date')
  const labelEl = fragment.querySelector('.task-item__label')
  const btnDeleteEl = fragment.querySelector('.task-item__btn-delete')
  const checkBoxEl = fragment.querySelector('.task-item__complete-check')

  if(complete) {
    checkEl.setAttribute('checked', '')
  }
  titleEl.textContent = title;
  dateEl.querySelector('.start').textContent = startDate
  dateEl.querySelector('.due').textContent = dueDate

  // [GET] - label 
  if (labelId) {
    const labelFragment = deepCopyFragment(template.taskLabel)
    const res = await starryAPI.get(`/labels/${labelId}`)
    switch (res.data.color) {
      case 'yellow':
        labelEl.classList.add('is-warning')
        break
      case 'green':
        labelEl.classList.add('is-success')
        break
      case 'blue':
        lableEl.classList.add('is-info')
        break
      case 'purple': 
        labelEl.classList.add('is-primary')
        break
      case 'no':
        labelEl.calssList.add('no-color')
        break
      default :
        labelEl.classList.add('is-danger')
    }
    labelEl.textContent = res.data.body
    render(labelFragment, labelEl)
  }

  // [DELETE] - task item 
  btnDeleteEl.addEventListener('click', async e => {
    const removeEl = btnDeleteEl.closest('.task-item')
    removeEl.classList.add('task-item--delete')
    try {
      await starryAPI.delete(`/tasks/${id}`)
      removeEl.remove()
    } catch(e) {
      projectNotification()
      removeEl.classList.remove('task-item--delete')
    }
  })

  checkBoxEl.addEventListener('click', async e => {
    if(e.target.checked) {
      await starryAPI.patch(`/tasks/${id}`, {complete: true})
    }
  })

  render(fragment, parentEl, false)
}

// Task Write Modal Component
async function taskWriteModal(listEl, projectId) {
  const fragment = deepCopyFragment(templates.taskWriteModal)
  const modalEl = fragment.querySelector('.task-write-modal')
  const formEl = modalEl.querySelector('.task-form')
  const btnCloseEl = modalEl.querySelector('.task-write-modal__btn-close')
  const btnSaveEl = modalEl.querySelector('.task-write-modal__btn-save')
  const btnCancelEl = modalEl.querySelector('.task-write-modal__btn-cancel')

  // [POST] - label
  btnSaveEl.addEventListener('click', async e => {
    // [POST] - task item
    const payload = {
      projectId,
      title: formEl.elements.title.value,
      body: formEl.elements.title.body,
      startDate: formEl.elements.startDate.value,
      dueDate: formEl.elements.dueDate.value,
      complete: false
    }
    const res = await starryAPI.post('/tasks', payload)
    taskItem(listEl, res.data) 
    modalEl.remove()
  })
  btnCloseEl.addEventListener('click', e => {
    modalEl.remove()
  })
  btnCancelEl.addEventListener('click', e => {
    modalEl.remove()
  })
  
  render(fragment, body, false)
}

const token = localStorage.getItem('token')

if (token) {
  login(token)
  indexPage()
} else {
  loginPage()
}
