# Starry todo

> 프론트엔드 개발 스쿨 중간 프로젝트로 만든 개인 프로젝트 관리 서비스입니다.  
서비스는 https://starry-todo.netlify.com/ 에서 확인하실 수 있습니다.

![starry todo screenshot](./starry-todo-screenshot.jpg)

## 프로젝트 목표

개인화 된 프로젝트 관리 서비스를 만들어 프로젝트 별로 작업을 생성 관리할 수 있도록 한다.

## 서비스 기능

### 1. 로그인/회원가입

- 사용자는 이름/패스워드 등록을 통해 계정을 생성할 수 있다.
- 회원가입시 이미 사용중인 이름은 사용할 수 없도록 안내 메시지를 제공한다.
- 로그인시 이름이나 패스워드가 틀렸을 경우 안내 메시지를 제공한다.
- 로그인 하지 않은 사용자는 프로젝트 페이지로 접근할 수 없고, 다른 사용자의 프로젝트에 접근할 수 없다.

### 2. 프로젝트(project)

- add your project 버튼을 클릭하면 프로젝트를 생성할 수 있다.
- 프로젝트 이름은 수정할 수 있다.
- 삭제 버튼을 클릭시 프로젝트를 삭제할 수 있다.

### 3. 작업(task)

- 프로젝트 목록에서 add your task 버튼을 클릭하면 모달을 통해 작업을 생성할 수 있다.
- 작업은 삭제할 수 있고, 완료 표시를 할 수 있다.
- 작업 생성시 작업 이름(title) / 세부 설명(description) / 기간(term) / 라벨(label)을 등록할 수 있다.
- 프로젝트 목록에서 작업을 클릭하면 개별적인 작업 모달에서 작업에 대한 설명을 확인할 수 있다.
- 작업 모달에서 edit 버튼을 클릭시 작업의 내용을 수정할 수 있다.

### 4. 라벨(label)

- 사용자는 작업마다 하나의 라벨을 붙일 수 있다.
- 라벨을 컬러를 선택할 수 있고, 이미 사용했던 라벨은 autocomplete 기능을 통해 찾아서 사용할 수 있다.

### 5. 댓글(activity)

- 사용자는 작업의 진행 상황을 작업 페이지에서 댓글로 기록해 둘 수 있다. 
- 댓글 등록시 등록 시간이 같이 기록된다. 등록한 댓글은 수정/삭제가 가능하다.

### 6. 검색 기능(filter)

- All Tasks / Incomplete Tasks / Completed Tasks로 완료 여부에 따른 필터 기능을 제공한다.
- 검색 바에서 작업(task)의 이름으로 키워드 검색이 가능하다.
- 라벨 검색 레이어에서 모든 라벨 목록을 확인할 수 있고 키워드로 라벨을 검색할 수 있다. 라벨 선택시 해당 라벨이 달린 태스크를 필터링한 화면을 제공한다.

## 기술 스택 

### Front-end

- HTML templates, JavaSciprt(ES6), SCSS
- axios
- moment
- [pikaday](https://github.com/dbushell/Pikaday) : data picker
- CSS Framework
  + [bluma](https://bulma.io/)
- bundler
  + parcel [base by fds-midproject-teamplate](https://github.com/fds9/fds-midproject-template)

### Back-end

- Server & Database
  + [fds-json-server](https://www.npmjs.com/package/fds-json-server)

### Deploy 

- [glitch](https://glitch.com/)를 통한 웹서버 배포
- [netlify](https://www.netlify.com/)를 통한 웹사이트 배포


## 프로젝트 이슈 로그

| 일자 | 수정/문제해결/목표 로그 |
| :---: | --- |
| 180528 | **[수정]** 프로젝트 인덱스 페이지에서 프로젝트 목록과 작업을 바로 삭제할 수 있도록 추가함<br>**[목표]** 삭제된 부분만 렌더링 되게 하고 싶은데 지금 짠 상태에서는 인덱스 페이지 전체를 다시 그리게 되어 좀더 함수 처리를 고민해봐야겠다. |
| 180529 | **[수정]** 프로젝트 삭제시 바로 삭제되는 것 처럼 보이도록 수정(클래스를 이용해 임시로 영역 날리고 전송완료시에는 완전히 없애도록함, 전송실패시에는 notification으로 알리고 임시로 숨기는 클래스 삭제)<br>**[수정]** 프로젝트 이름을 바로 수정할 수 있도록 마크업을 수정<br>**[문제해결]** 프로젝트 이름 수정을 위해 `<textarea>`로 마크업을 수정했는데, 텍스트 입력에 따라 높이가 늘어나지 않고 `overflow: visible`을 넣더라도 세로 스크롤만 생김. -  최초 문자열 크기에 맞춰 높이가 고정된다고 함(`resize: none`과는 별개의 동작)<br> `<textarea>`를 `position: absolute`시키고 가로 세로 100%으로 설정한뒤 그 뒤로 가려지는 같은 폰트 스타일을 가진 `<div>` 더미 박스에 `<textarea>`의 `value`값이 입력되도록 함. 더미 `<div>`의 영역만큼 `<textarea>`도 높이를 가지게 되었다.<br> **[문제해결]** 브라우저에 맞춤법 검사를 해주는 기능이 있어서 textarea가 입력된 상태에서 빨간 밑줄이 생김, textarea자체를 프로젝트의 타이틀 기능을 하도록 할 것이기 때문에 맞춤법 검사 기능을 꺼야함<br> [spellcheck](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/spellcheck)라는 global attribute 값을 `false`처리해서 기능을 사용하지 않음 처리함<br> **[문제해결]** 프로젝트 추가 후에 새로고침하면 project item 정렬이 뒤죽박죽이 됨. res.data.id를 콘솔에 찍어보면 순서대로 나오는데... <br>for ... of 문 안에서 호출하는 `projectItem()` 앞에 `await`를 추가했더니 순서대로 나옴<br> **[문제해결]** 프로젝트 추가 입력이나 프로젝트 타이틀 수정시에 enter 키를 누르거나 인풋에서 blur될때 다음 동작을 처리하고 싶은데 동작 부분을 함수로 정의하고 각각의 이벤트에 이벤트 핸들러로 넣었더니 (당연하지만...;;) 프로젝트가 중복 생성됨<br> enter 키 이벤트에서 인풋 엘리먼트에 `blur()` 메소드를 사용해 focus out되게 함으로써 blur 이벤트로 넘어가도록 처리함 |
| 180530 | **[문제해결]** `taskModal()`함수에 인자를 분할대입으로 받도록 했더니 같은 데이터를 넘겨받기 위해 똑같이 인자를 분할대입해서 받는 `taskItem()` 함수 안에서 `taskModal()`을 호출할 경우 다시 인자를 넘길때도 분할대입으로 해줘야했다.<br> / 강사님과 트러블 슈팅 시간에 이부분에 대해 객체를 인자로 넘겨받고 함수 내부에서 분할 대입을 해주는 게 어떻겠냐는 조언을 받아 수정했더니 훨씬 깔끔해졌다. <br> **[문제해결]** 화면을 새로 그리지 않는 모달의 경우 불러오는 동안 빠르게 다른 아이콘을 사용하면 모달을 중복으로 생성했다. 기존에 `promise`를 인자로 받아 loading 템플릿을 그렸다 제거하는 함수를 사용했다. <br> **[문제해결]** 라벨 자동완성(추천) 기능을 만들었는데, 기존 라벨을 선택하면 그 값을 인풋이나 라디오 버튼에 값을 넘겼더니 마지막에 submit시에 결국은 그 던져준 값으로 라벨을 생성하는 코드가 있어서 라벨이 중복으로 생성되었다. <br> / 이미 생겨난 라벨을 중복 생성하지 않고 재사용 가능하도록 UI를 아예 고쳐서 삭제 버튼이 있는 라벨 태그와 폼 부분이 바꿔치기 되도록 수정했다. label인풋값은 비워버리게 했다. (인풋의 값이 깨끗하다면 문제를 일으킨 코드 부분을 if문에 의해 걸러진다.) / <br> **[문제해결]** render() 함수에서 appenChild() 할 부모엘리먼트에서 참조 오류가 생겼다. 디버깅을 통해 타고 올라가니 전역 변수를 `body`같은 식으로 쓴것이 문제가 되었다. `body`는 전역 변수이름으로 쓰기 너무 위험한 이름이고(전역변수 자체가 좋지 않지만...) 또 응답 데이터를 인자로 던지는데 그 응답데이터 중 body가 있어서 충돌했다. 해당 부분은 `bodyEl`로 수정했다. <br> **[목표]** 시간만 되면 전역변수를 포함해 코드를 싹 수정하고 싶다. 목표한 데드라인 기능을 넣을 수 있을지 의문이다. 완료, 미완료, 전체 작업 정렬이나, 작업 검색 기능도 만들자 |
| 180531 | **[문제해결]** 작업 작성 폼과 수정폼을 같이 쓰고 싶었는데 완료되면 보내는 통신 메소드가 다름(POST / PATCH) /<br> 작성 폼을 렌더하는 함수(`taskWiteModal()`)를 호출할 때 다른 통신의 로직을 넣은 `addTask()` / `editTask()` 함수를 인자로 넘겨 호출하도록 수정함. <br>**[문제해결]** `labelItem()`로 라벨을 생성하고 나면 어떤 라벨을 삭제 버튼을 만들어서 삭제 버튼을 눌렀을때 동작이 있어야 하고 어떤 라벨은 그냥 렌더만 되어야함. 다른 함수를 만들까 하다가 렌더하는 부분까지는 동일한 동작이므로 이 역시 다른 로직을 담은 함수를 인자로 넘기는 방식으로 처리함 <br>**[문제해결]** flex를 이용해 레이아웃을 만들었는데, 크롬에서는 멀쩡하던 것이 파이어폭스에서는 깨짐, `flex-flow`, `flex-basis`, `flex-shrink`나 이들의 축약 형태인 `flex`를 사용시 정확하게 이해하고 만들지 않아서 발생한 문제 <br> `flex`의 값을 상위에서부터 `auto`(`1 1 auto`와 같은 의미)로 수정했더니 해결됨. 가로로 스크롤이 생기는 부분만 (`1 0 100%`)로 처리함(영역에 맞춰 축소시키지 않는다는 의미)<br> **[수정]** 기능이 많아지면서 점점 로직이 복잡해지고 함수에 넘기는 매개변수도 다양해지므로 주석으로 설명 추가함 <br>**[수정]** 기간관련해서 `pikaday`라는 datapicker 라이브러리 사용(moment.js와도 잘 맞음), 기간 관련된 기능부분 추가함. <br>**[수정]** 완료 처리된 작업 스타일링 <br> **[수정]** 프로젝트와 작업, 활동로그가 나중에 등록된 것이 앞으로 위로 쌓이도록 하는 것이 사용성면에서 더 좋을 것 같아서 `render()`(내부적으로 `appendChild`)함수 대신 `prepend()`메소드를 사용하도록 수정함([단, 이 jQuery-like 메소드는 익스에서 지원하지 않음 필요하다면 폴리필을 추가해야할 듯하다.](https://caniuse.com/#search=prepend)) | 
| 180601 | **[수정]** 완료 작업별, 검색 키워드로 소팅된 작업만 보여지도록 기능 추가. 라벨 별 검색 기능 추가. <br>**[문제해결]** 소팅된 작업을 `taskItem()`호출해서 그리는 것으로 하니까 작업을 하나씩 그려서 던지므로 리플로우가 여러번 발생함, `prepend`로 인해 앞으로 쌓이면서 먼저 생성된 작업이 뒤로 밀리니까 보기에도 좋지 않음. <br>`projectList()` 렌더 함수를 만들어 `projectContent()` 로직에서 리스트를 그리는 템플릿을 분리함. 리스트 템플릿을 하나 더 만들어 작업을 리스트에 다 그리면 그 리스트를 한번에 그려주도록 수정함(리플로우 한번만 발생), <br>**[문제해결]** 완료, 미완료 작업을 검색후 키워드 검색과 라벨 검색에서 _완료된 검색의 ~ 키워드 검색_ 과 _완료된 검색의 ~라벨 검색_ 이라식으로 로직이 겹침 `keywordSearch()` 라는 함수에 해당 로직을 넣고 `predicate` 역할을 하는 함수를 인자로 받도록 함수형으로 수정하여 재사용함<br> `projectItem()`과 `proejctList()`함수는 `filter`에 따라 다르게 그려져야하므로 이 역시 함수를 인자로 받는 함수형으로 수정함 | **[문제해결]** 폼에서 엔터키를 누르면 `submit`되지 않고 라벨쪽 숨겨둔 폼이 노출되는 이상 발견.<br> 라벨 쪽 폼에 사용한 버튼의 type이 button이 아니라서 submit 이벤트가 발생된 것이었다. `type='button'`을 추가했더니 해결되었다. |
| 180603 | **[수정]** 완료 여부 작업 정렬부분에 중복되는 코드 정리함. 키워드 검색 취소 후 다시 완료 여부 정렬되었던 상태로 돌아가도록 수정<br> **[수정]** 완료 정렬 버튼에 키보드 지원 추가(up, down arrows / enter, space / tab key)<br>**[목표]** 최종 프로젝트에서는 탈퇴기능, 삭제 시 한번 더 물어보는 알람, 드래그앤드롭으로 순서 변경하는 기능 추가하자. |