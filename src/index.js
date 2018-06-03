import axios from 'axios'
import moment from 'moment'
import Pikaday from 'pikaday'

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
  projectList:    document.querySelector('#project-list').content,
  projectItem:    document.querySelector('#project-item').content,
  dateTerm:       document.querySelector('#date-term').content,
  taskItem:       document.querySelector('#task-item').content,
  taskLabel:      document.querySelector('#task-label').content,
  taskWriteModal: document.querySelector('#task-write-modal').content,
  taskModal:      document.querySelector('#task-modal').content,
  activityItem:   document.querySelector('#activity-item').content,
}

function deepCopyFragment(template) {
  return document.importNode(template, true)
}

/* ------------------------
 * render
 * ------------------------
 * fragment: 그려질 fragment
 * parent: 기준이 될 부모 엘리먼트
 * clear: parent를 지우고 다시 그릴지 여부
 */
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

/* ------------------------
 * Notification Component
 * ------------------------
 * message: 출력할 문자열
 * parentNode: render 기준이 될 부모 엘리먼트
 * stateClass: 스타일 관련 클래스명 문자열
 */
function notification(message, parentEl, stateClass) {
  const fragment = document.importNode(templates.notification, true);
  const notification = fragment.querySelector('.notification');
  
  notification.textContent = message
  notification.classList.add(stateClass)
  render(fragment, parentEl)
}

/* ------------------------
 * Sign Submit Button Event
 * ------------------------
 * path: http POST시 전달 할 path 문자열
 * formElements: form과 form 버튼 엘리먼트 담은 객체
 * failMessage: sign in, up 실패시 노출할 메시지 문자열
 */
function signSubmit(path, formElements, failMessage) {
  const {form, btnSubmit} = formElements
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

/* ------------------------
 * Sign Link Button Event
 * ------------------------
 * btnLink: link 버튼 엘리먼트
 * func: link 버튼 클릭시 실행할 page 함수
 */
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

/* ------------------------
 * Loading Component
 * ------------------------
 * promise: 로딩 뒤에 실행 될 promise
 * parent: loading render될 부모엘리먼트 (기본값 body 엘리먼트)
 */
async function withLoading(promise, parentEl = bodyEl) {
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
  const accountUser = fragment.querySelector('.account__user-name')
  const contentEl = fragment.querySelector('.contents');

  const res = await starryAPI.get('/me')
  accountUser.textContent = res.data.username
  btnLogout.addEventListener('click', e => {
    logout()
    loginPage()
  })
  withLoading(projectContent(contentEl))
  render(fragment)
}

/* ------------------------
 * Project Notification Component
 * ------------------------
 * message: 프로젝트 notification에 사용할 메시지 문자열
 */
function projectNotification(message = `Network error please try again later`) {
  const notificationEl = document.querySelector('.project-notification')
  notification(message, notificationEl, 'is-warning')
  setTimeout(() => {
    notificationEl.textContent = ''
  }, 3000)
}

/* ------------------------
 * Form Element Blur
 * ------------------------
 * el: enter keydown 이벤트시 blur시킬 엘리먼트
 */
function inputCompleteBlur(el) {
  el.addEventListener('keydown', e => {
    if(e.keyCode === 13) {
      e.preventDefault()
      el.blur()
    }
  })
}

/* ------------------------
 * Project Content Component
 * ------------------------
 * parentEl: render될때 기준이 되는 부모 엘리먼트
 */
async function projectContent(parentEl) {
  const fragment = deepCopyFragment(templates.projectContent)
  const listEl = fragment.querySelector('.project-list-wrap')
  const formEl = fragment.querySelector('.project-write-form')
  const btnAddEl = formEl.querySelector('.projects__btn-add-project')
  const inputEl = formEl.querySelector('.project-write-form__input')
  const sortEl = fragment.querySelector('.task-sort')
  const searchEl = fragment.querySelector('.projects-search-form')
  const searchElInput = searchEl.querySelector('.input')
  const labelSortEl = fragment.querySelector('.label-sort')

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
        const content = document.querySelector('.project-list')
        projectItem(content, res.data)
        formEl.classList.remove('project-write-form--writing')
        inputEl.value = ''
      } catch (e) {
        projectNotification()
      }
    } else {
      formEl.classList.remove('project-write-form--writing')
    }
  })

  // 완료 여부 소팅
  const sortElState = {
    state: false,
    open() {
      sortEl.classList.add('task-sort--open')
      this.state = true
    },
    close() {
      sortEl.classList.remove('task-sort--open')
      this.state = false
    }
  }

  const sortBtnEl = sortEl.querySelector('.task-sort__btn-open')
  const sortBodyEl = sortEl.querySelector('.task-sort__body')
  sortBtnEl.addEventListener('click', () => {
    sortElState.open()
    sortBodyEl.focus()
    // 중복 조건 정렬 지원하게 만들 수 있다면 이 부분 삭제
    searchEl.classList.remove('projects-search--no-empty')
    searchElInput.value = ''
  })
  sortBodyEl.addEventListener('blur', () => {
    sortElState.close()
    sortBtnEl.focus()
  })

  function keywordSearch (parentEl, predicate) {
    projectList(parentEl, async content => {
      const res = await starryAPI.get('/projects?_embed=tasks')
      for (const data of res.data) {
        let filter;
        if(sortState.value === 'complete') {
          filter = item => predicate(item) && item.complete
        } else if (sortState.value === 'incomplete') {
          filter = item => predicate(item) && !item.complete
        } else {
          filter = item => predicate(item)
        }
        if(data.tasks.some(filter)) {
          await withLoading(projectItem(content, data, filter))
        }
      }
    })
  }

  const sortState = {};
  // 완료 여부로 task 정렬
  sortEl.querySelectorAll('.task-sort__radio').forEach(el => {
    el.addEventListener('click', async () => {
      if(el.checked) {
        const res = await starryAPI.get('/projects?_embed=tasks')
        sortState.value = el.value
        let filter;
        switch(sortState.value) {
          case 'complete' : 
            filter = item => item.complete
            break
          case 'incomplete': 
            filter = item => !item.complete
            break
          default: 
            filter = item => true
            break
        }
        await projectList(listEl, async content => {
          for (const data of res.data) {
            if(data.tasks.some(filter)) {
              await withLoading(projectItem(content, data, filter))
            }
          }
        })
        sortElState.close()
      }
    })
  })

  // 라벨 소팅 
  const labelSortElState = {
    state: false,
    open() {
      labelSortEl.classList.add('label-sort--open')
      this.state = true
    },
    close() {
      labelSortEl.classList.remove('label-sort--open')
      this.state = false
    }
  }
  const labelSortBtnEl = labelSortEl.querySelector('.label-sort__btn-open')
  const labelSortBodyEl = labelSortEl.querySelector('.label-sort__body')
  const labelSortListEl = labelSortEl.querySelector('.label-sort__list')
  let labelRes;
  labelSortBtnEl.addEventListener('click', async e => {
    labelSortElState.open()
    // 중복 조건 정렬 지원하게 만들 수 있다면 이 부분 삭제
    searchEl.classList.remove('projects-search--no-empty')
    searchElInput.value = ''
    // 이 부분은 별도의 템플릿으로 개선되면 수정
    labelSortListEl.textContent = ''
    labelRes = await starryAPI.get('/labels')
    for (const data of labelRes.data) {
      const {body, id} = data
      await labelItem(labelSortListEl, data, item => {
        item.addEventListener('click', e => {
          keywordSearch(listEl, item => item.labelId === id)
          labelSortElState.close()
        })
      })
    }
  })

  labelSortEl.querySelector('.label-sort__search').addEventListener('submit', e => {
    e.preventDefault();
    labelSortListEl.textContent = ''
    const labelKeyword = e.target.label.value.toLowerCase()
    for (const data of labelRes.data) {
      const {body, id} = data
      if(body.toLowerCase().includes(labelKeyword)) {
        // 라벨 자동완성 목록에서 생성되는 라벨
        labelItem(labelSortListEl, data, item => {
          item.addEventListener('click', e => {
            keywordSearch(listEl, item => item.labelId === id)
            labelSortElState.close()
          })
        })
      }
    }
  })

  labelSortBodyEl.querySelector('.delete').addEventListener('click', () => {
    labelSortElState.close()
    labelSortBtnEl.focus()
  })

  // 작업 검색
  searchEl.addEventListener('submit', async e => {
    e.preventDefault()
    listEl.textContent = ''
    const keyword = searchElInput.value
    keywordSearch(listEl, item => item.title.includes(keyword))
  })
  searchElInput.addEventListener('keyup', e => {
    if (e.target.value) {
      searchEl.classList.add('projects-search--no-empty')
    } else {
      searchEl.classList.remove('projects-search--no-empty')
    }
  })
  searchEl.querySelector('.delete').addEventListener('click', async e => {
    searchElInput.value = ''
    searchElInput.focus()
    await projectList(listEl, async content => {
      const res = await starryAPI.get('/projects')
      for (const data of res.data) {
        await withLoading(projectItem(content, data, () => true))
      }
    })
  }) 

  await projectList(listEl, async content => {
    const res = await starryAPI.get('/projects')
    for (const data of res.data) {
      await projectItem(content, data, () => true)
    }
  })
  render(fragment, parentEl, false)
}

/* ------------------------
 * Project List Component
 * ------------------------
 * parentEl: render될때 기준이 되는 부모 엘리먼트
 * func: 렌더되는 `.project-list`를 인자로 하여 리스트 렌더 전에 실행시킬 함수
 */
async function projectList(parentEl, func) {
  const fragment = deepCopyFragment(templates.projectList)
  const content = fragment.querySelector('.project-list')

  await func(content)

  render(fragment, parentEl)
}

/* ------------------------
 * Project Item Component
 * ------------------------
 * parentEl: render될때 기준이 되는 부모 엘리먼트
 * projectObj: 프로젝트 title, id 정보를 담은 객체
 * filter: GET 응답 data를 인자로 받음. taskItem 호출 전 조건으로 던질 filter 함수
 */
async function projectItem(parentEl, projectObj, filter) {
  const {title, id} = projectObj;
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
    if(filter(data)) {
      await taskItem(listEl, data)
    }
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

  btnAddEl.addEventListener('click', async e => {
    await withLoading(taskWriteModal(listEl, {projectId: id}, addTask))
  })
  parentEl.prepend(fragment)
}

/* ------------------------
 * Label Item Component
 * ------------------------
 * parentEl: render될때 기준이 되는 부모 엘리먼트
 * labelObj: 라벨 color, body 정보를 담은 객체
 * func: 라벨 렌더 전 추가로 넣고 싶은 로직담은 함수
 */
async function labelItem(parentEl, labelObj, func) {
  const {color, body} = labelObj
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
      break
  }
  label.textContent = body
  if(func) func(label)
  render(fragment, parentEl, false)
}

async function dateTerm(parentEl, start, end) {
  const fragment = deepCopyFragment(templates.dateTerm)
  fragment.querySelector('.start').textContent = start
  fragment.querySelector('.end').textContent = end
  render(fragment, parentEl)
}
/* ------------------------
 * Task Item Component
 * ------------------------
 * parentEl: render될때 기준이 되는 부모 엘리먼트
 * taskObj: 작업의 title, body, startDate, dueDate, complete, labelId, projectId, id 정보를 담은 객체
 * ------------------------
 * return: itemEl promise
 */
async function taskItem(parentEl, taskObj) {
  const {title, body, startDate, dueDate, complete, labelId, projectId, id} = taskObj
  const fragment = deepCopyFragment(templates.taskItem)
  const itemEl = fragment.querySelector('.task-item')
  const titleEl = itemEl.querySelector('.task-item__title')
  const checkBoxEl = itemEl.querySelector('.task-item__complete-checkbox')
  const checkEl = itemEl.querySelector('.task-item__complete-check')
  const dateEl = itemEl.querySelector('.task-item__date')
  const labelEl = itemEl.querySelector('.task-item__label')
  const btnDeleteEl = itemEl.querySelector('.task-item__btn-delete')

  if(complete) {
    checkEl.setAttribute('checked', '')
  }
  titleEl.textContent = title;

  if(startDate || dueDate) {
    dateTerm(dateEl, startDate, dueDate)
  }

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
    withLoading(taskModal(parentEl, taskObj))
  })
  
  checkBoxEl.addEventListener('click', e => {
    e.stopPropagation()
  })
  checkEl.addEventListener('change', async e => {
    if(e.target.checked) {
      checkBoxEl.classList.add('checked')
      await starryAPI.patch(`/tasks/${id}`, {complete: true})
    } else {
      checkBoxEl.classList.remove('checked')
      await starryAPI.patch(`/tasks/${id}`, {complete: false})
    }
  })

  itemEl.classList.add(`task-item-${id}`)
  parentEl.prepend(fragment)
  return itemEl
}

/* ------------------------
 * Task Write Modal Component
 * ------------------------
 * listEl: taskItem()에 전달할 render될때 기준이 되는 부모 엘리먼트
 * taskObj: 작업의 title, body, startDate, dueDate, complete, labelId, projectId, id 정보를 담은 객체
 * func: addTask(), editTask()등의 post, patch 통신을 위한 함수
 */
async function taskWriteModal(listEl, taskObj, func) {
  const {title, body, startDate, dueDate, complete, labelId, projectId, id} = taskObj
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

  if (title) {
    formEl.elements.title.value = title
    formEl.elements.body.value = body
  }
  if (startDate || dueDate) {
    formEl.elements.startDate.value = startDate
    formEl.elements.dueDate.value = dueDate
  }
  function addDeleteButton(item) {
    const button = document.createElement('button')
    button.classList.add('delete')
    button.setAttribute('type', 'button')
    button.addEventListener('click', e => {
      e.preventDefault()
      item.remove()
      selectLabelId = null
      formLabelEl.classList.remove('task-form__label--selected')
    })
    item.appendChild(button)
  }
  if (labelId) {
    const res = await starryAPI.get(`/labels/${labelId}`)
    formLabelEl.classList.add('task-form__label--selected')
    labelItem(formEl.querySelector('.label-selected-body'), res.data, addDeleteButton)
  }

  // modal close
  btnCloseEl.addEventListener('click', e => {
    modalEl.remove()
  })
  btnCancelEl.addEventListener('click', e => {
    modalEl.remove()
  })

  // label color
  colorSelectBtn.addEventListener('click', e => {
    colorSelect.classList.add('label-color-select--open')
    colorSelect.setAttribute('tabIndex', '0')
    colorSelect.focus()
  })
  colorSelect.addEventListener('blur', () => {
    colorSelect.removeAttribute('tabIndex')
    colorSelect.classList.remove('label-color-select--open')
  })
  colorSelect.querySelectorAll('.label-color-select__item').forEach(item => {
    item.addEventListener('click', e => {
      colorSelectBtn.children[0].setAttribute('class', item.querySelector('.tag').getAttribute('class'))
      colorSelect.classList.remove('label-color-select--open')
    })
  })

  let selectLabelId;
  // [GET] - label
  const labelRes = await starryAPI.get('/labels')
  labelBody.querySelector('.label-body__input').addEventListener('keyup', async e => {
    labelBodyList.textContent = ''
    if (e.target.value !== '') {
      for (const {id, body, color} of labelRes.data) {
        if(body.toLowerCase().includes(e.target.value.toLowerCase())) {
          labelBody.classList.add('label-body--open')
          // 라벨 자동완성 목록에서 생성되는 라벨
          labelItem(labelBodyList, {body, color}, item => {
            item.addEventListener('click', e => {
              selectLabelId = id
              formEl.elements.labelTitle.value = ''
              formLabelEl.classList.add('task-form__label--selected')
              // 선택되어 폼을 숨기면서 생성되는 라벨
              labelItem(formEl.querySelector('.label-selected-body'), {color, body}, addDeleteButton)
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
  
  // datepicker
  const datepicker = {
    format: 'YYYY.MM.DD',
    minDate: moment('20180101').toDate(),
    maxDate: moment('20301231').toDate(),
    yearRange: [2018,2030]
  }
  const startPicker = new Pikaday({
    field: formEl.querySelector('#startDatePicker'),
    ...datepicker
  })
  const endPicker = new Pikaday({
    field: formEl.querySelector('#dueDatePicker'),
    ...datepicker
  })
  formEl.addEventListener('submit', async e => {
    e.preventDefault()
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
      } else if (selectLabelId) {
        payload.labelId = selectLabelId
      }

      func(listEl, payload, id)
      modalEl.remove()
    }
  })

  render(fragment, bodyEl, false)
  formEl.elements.title.focus()
}

async function addTask(parentEl, payload) {
  const res = await starryAPI.post('/tasks', payload)
  withLoading(taskItem(parentEl, res.data))
}

async function editTask(parentEl, payload, taskId) {
  const oldTaskItem = document.querySelector(`.task-item-${taskId}`)
  const res = await starryAPI.patch(`/tasks/${taskId}`, payload)
  let newTaskItem;
  await withLoading(taskItem(parentEl, res.data).then(val => newTaskItem = val), oldTaskItem)
  parentEl.replaceChild(newTaskItem, oldTaskItem)
}

/* ------------------------
 * Activity Item
 * ------------------------
 * parentEl: render될 기준이 되는 부모 엘리먼트
 * activityObj: 활동 body, logDate, id 정보를 담은 객체
 */
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
  parentEl.prepend(fragment)
  // render(fragment, parentEl, false)
}

/* ------------------------
 * Task Modal 
 * ------------------------
 * itemParentEl: taskWriteModal()함수 첫번째 인자에 전달할 작업 아이템의 부모 엘리먼트
 * taskObj: 작업의 title, body, startDate, dueDate, complete, labelId, projectId, id 정보를 담은 객체
 */
async function taskModal(itemParentEl, taskObj) {
  const {title, body, startDate, dueDate, complete, labelId, projectId, id} = taskObj
  const fragment = deepCopyFragment(templates.taskModal)
  const modalEl = fragment.querySelector('.task-modal')
  const btnCloseEl = modalEl.querySelector('.task-modal__btn-close')
  const formEl = modalEl.querySelector('.activity-form')
  const listEl = modalEl.querySelector('.activity-list')
  const labelEl = modalEl.querySelector('.task-modal__label')
  const dateEl = modalEl.querySelector('.task-modal__date')
  
  btnCloseEl.addEventListener('click', e => {
    modalEl.remove()
  })

  modalEl.querySelector('.task-modal__title').textContent = title
  modalEl.querySelector('.task-modal__body').textContent = body
  
  if(startDate || dueDate) {
    dateTerm(dateEl, startDate, dueDate)
  }
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

  modalEl.querySelector('.task-modal__btn-edit').addEventListener('click', () =>{
    withLoading(taskWriteModal(itemParentEl, taskObj, editTask))
    modalEl.remove();
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