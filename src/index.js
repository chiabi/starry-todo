import axios from 'axios'
import moment from 'moment'

const starryAPI = axios.create({
  baseURL: process.env.API_URL
})

const bodyEl = document.querySelector('body')
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
  taskLabel:      document.querySelector('#task-label').content,
  taskWriteModal: document.querySelector('#task-write-modal').content,
  taskModal:      document.querySelector('#task-modal').content,
  activityItem:   document.querySelector('#activity-item').content,
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
async function withlLoading(promise, parentEl = bodyEl) {
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
    await taskItem(listEl, data)
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
  titleInputEl.addEventListener('keyup', e => {
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
    withlLoading(taskWriteModal(listEl, id))
  })
  
  render(fragment, parentEl, false)
}

// Label Item Component
async function labelItem(parentEl, {color, body}, func) {
  const fragment = deepCopyFragment(templates.taskLabel)
  const label = fragment.querySelector('.tag')

  switch (color) {
    case 'yellow':
      label.classList.add('is-warning')
      break
    case 'green':
      label.classList.add('is-success')
      break
    case 'blue':
      label.classList.add('is-info')
      break
    case 'purple': 
      label.classList.add('is-primary')
      break
    case 'no':
      label.classList.add('no-color')
      break
    default :
      label.classList.add('is-danger')
  }
  label.textContent = body
  if(func) func(label)
  render(fragment, parentEl, false)
}

// Task Item Component
async function taskItem(parentEl, taskObj) {
  const {title, body, startDate, dueDate, complete, labelId, id} = taskObj
  const fragment = deepCopyFragment(templates.taskItem)
  const itemEl = fragment.querySelector('.task-item')
  const titleEl = itemEl.querySelector('.task-item__title')
  const checkEl = itemEl.querySelector('.task-item__complete-check')
  const dateEl = itemEl.querySelector('.task-item__date')
  const labelEl = itemEl.querySelector('.task-item__label')
  const btnDeleteEl = itemEl.querySelector('.task-item__btn-delete')
  const checkBoxEl = itemEl.querySelector('.task-item__complete-check')

  if(complete) {
    checkEl.setAttribute('checked', '')
  }
  titleEl.textContent = title;
  dateEl.querySelector('.start').textContent = startDate
  dateEl.querySelector('.due').textContent = dueDate

  // [GET] - label 
  if (labelId) {
    const res = await starryAPI.get(`/labels/${labelId}`)
    labelItem(labelEl, res.data)
  }

  // [DELETE] - task item 
  btnDeleteEl.addEventListener('click', async e => {
    e.stopPropagation()
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

  itemEl.addEventListener('click', e => {
    withlLoading(taskModal(taskObj))
  })
  
  checkBoxEl.addEventListener('click', async e => {
    e.stopPropagation()
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
  const colorSelect = formEl.querySelector('.label-color-select')
  const colorSelectBtn = colorSelect.querySelector('.label-color-select__btn')
  const formLabelEl = formEl.querySelector('.task-form__label')
  const labelBody = formEl.querySelector('.label-body')
  const labelBodyList = labelBody.querySelector('.label-body__list')

  btnCloseEl.addEventListener('click', e => {
    modalEl.remove()
  })
  btnCancelEl.addEventListener('click', e => {
    modalEl.remove()
  })

  colorSelectBtn.addEventListener('click', e => {
    colorSelect.classList.add('label-color-select--open')
  })
  colorSelect.addEventListener('blur', () => {
    colorSelect.classList.remove('label-color-select--open')
  })
  colorSelect.querySelectorAll('.label-color-select__item').forEach(item => {
    item.addEventListener('click', e => {
      colorSelectBtn.children[0].setAttribute('class', item.querySelector('.tag').getAttribute('class'))
      colorSelect.classList.remove('label-color-select--open')
    })
  })
  let labelId;
  // [GET] - label
  const labelRes = await starryAPI.get('/labels')
  labelBody.querySelector('.label-body__input').addEventListener('keyup', async e => {
    labelBodyList.textContent = ''
    if (e.target.value !== '') {
      for (const {id, body, color} of labelRes.data) {
        if(body.toLowerCase().includes(e.target.value.toLowerCase())) {
          labelBody.classList.add('label-body--open')
          labelItem(labelBodyList, {body, color}, item => {
            item.addEventListener('click', e => {
              labelId = id
              formEl.elements.labelTitle.value = ''
              formLabelEl.classList.add('task-form__label--selected')
              labelItem(formEl.querySelector('.label-selected-body'), {color, body}, item => {
                const button = document.createElement('button')
                button.classList.add('delete')
                button.addEventListener('click', e => {
                  e.preventDefault()
                  item.remove()
                  labelId = null
                  formLabelEl.classList.remove('task-form__label--selected')
                })
                item.appendChild(button)
              })
              labelBody.classList.remove('label-body--open')
            })
          })
        }
      }
    } else {
      labelBody.classList.remove('label-body--open')
    }
  })

  labelBody.addEventListener('blur', e => {
    labelBody.classList.remove('label-body--open')
  })
  
  formEl.addEventListener('submit', async e => {
    e.preventDefault()
    // [POST] - task item
    const payload = {
      projectId,
      title: formEl.elements.title.value,
      body: formEl.elements.body.value,
      startDate: formEl.elements.startDate.value,
      dueDate: formEl.elements.dueDate.value,
      complete: false
    }
    if(payload.title) {
      // label
      const labelValue = formEl.elements.labelTitle.value
      if (labelValue) {
        // [POST] - label
        const labelPayLoad = {
          body: labelValue,
          color: formEl.elements.labelColor.value
        }
        const res = await starryAPI.post('/labels', labelPayLoad)
        payload.labelId = res.data.id
      } else if (labelId) {
        payload.labelId = labelId
      }
      const res = await starryAPI.post('/tasks', payload)
      taskItem(listEl, res.data)
      modalEl.remove()
    }
  })
  
  render(fragment, bodyEl, false)
}

// Activity Item
async function activityItem(parentEl, activityObj) {
  const {body, logDate, id} = activityObj
  const fragment = deepCopyFragment(templates.activityItem)
  const itemEl = fragment.querySelector('.activity-item')
  const bodyShadowEl = itemEl.querySelector('.activity-item__body-shadow')
  const bodyInputEl = itemEl.querySelector('.activity-item__body-input')
  const itemDateEl = itemEl.querySelector('.date')

  bodyShadowEl.textContent = body
  bodyInputEl.value = body
  itemDateEl.textContent = logDate

  fragment.querySelector('.delete').addEventListener('click', async e => {
    itemEl.remove()
    await starryAPI.delete(`/activities/${id}`)
  })
  
  bodyInputEl.addEventListener('keyup', e => {
    bodyShadowEl.textContent = e.target.value
  })
  inputCompleteBlur(bodyInputEl)
  // [PATCH] - activity item
  bodyInputEl.addEventListener('blur', async e => {
    const payload = {
      body: e.target.value
    }
    try {
      await starryAPI.patch(`/activities/${id}`, payload)
    } catch(e) {
      bodyShadowEl.textContent = body
      bodyInputEl.value = body
    }
  })
  render(fragment, parentEl, false)
}

// Task Modal 
async function taskModal(taskObj) {
  const {title, body, startDate, dueDate, complete, labelId, id} = taskObj
  const fragment = deepCopyFragment(templates.taskModal)
  const modalEl = fragment.querySelector('.task-modal')
  const btnCloseEl = modalEl.querySelector('.task-modal__btn-close')
  const formEl = modalEl.querySelector('.activity-form')
  const listEl = modalEl.querySelector('.activity-list')
  const labelEl = modalEl.querySelector('.task-modal__label')
  
  btnCloseEl.addEventListener('click', e => {
    modalEl.remove()
  })

  modalEl.querySelector('.task-modal__title').textContent = title
  modalEl.querySelector('.task-modal__body').textContent = body
  
  if (labelId) {
    const res = await starryAPI.get(`/labels/${labelId}`)
    labelItem(labelEl, res.data)
  }

  // [GET] - render task item
  const res = await starryAPI.get(`/tasks/${id}/activities`)
  for (const data of res.data) {
    await activityItem(listEl, data)
  }

  // [POST] - activity item
  formEl.addEventListener('submit', async e => {
    e.preventDefault()
    const payload = {
      body: e.target.body.value,
      logDate: moment().format('YYYY.MM.DD h:mm:ss'),
      taskId: id
    }
    const res = await starryAPI.post(`/activities`, payload)
    e.target.body.value = ''
    activityItem(listEl, res.data)
  })
  render(fragment, bodyEl, false)
}

const token = localStorage.getItem('token')

if (token) {
  login(token)
  indexPage()
} else {
  loginPage()
}
