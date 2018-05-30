# Starry todo

| 일자 | 수정/문제해결/목표 로그 |
| :---: | --- |
| 180528 | **[수정]** 프로젝트 인덱스 페이지에서 프로젝트 목록과 작업을 바로 삭제할 수 있도록 추가함<br>**[목표]** 삭제된 부분만 렌더링 되게 하고 싶은데 지금 짠 상태에서는 인덱스 페이지 전체를 다시 그리게 되어 좀더 함수 처리를 고민해봐야겠다. |
| 180529 | **[수정]** 프로젝트 삭제시 바로 삭제되는 것 처럼 보이도록 수정(클래스를 이용해 임시로 영역 날리고 전송완료시에는 완전히 없애도록함, 전송실패시에는 notification으로 알리고 임시로 숨기는 클래스 삭제)<br>**[수정]** 프로젝트 이름을 바로 수정할 수 있도록 마크업을 수정<br>**[문제해결]** 프로젝트 이름 수정을 위해 `<textarea>`로 마크업을 수정했는데, 텍스트 입력에 따라 높이가 늘어나지 않고 `overflow: visible`을 넣더라도 세로 스크롤만 생김. -  최초 문자열 크기에 맞춰 높이가 고정된다고 함(`resize: none`과는 별개의 동작)<br> `<textarea>`를 `position: absolute`시키고 가로 세로 100%으로 설정한뒤 그 뒤로 가려지는 같은 폰트 스타일을 가진 `<div>` 더미 박스에 `<textarea>`의 `value`값이 입력되도록 함. 더미 `<div>`의 영역만큼 `<textarea>`도 높이를 가지게 되었다.<br> **[문제해결]** 브라우저에 맞춤법 검사를 해주는 기능이 있어서 textarea가 입력된 상태에서 빨간 밑줄이 생김, textarea자체를 프로젝트의 타이틀 기능을 하도록 할 것이기 때문에 맞춤법 검사 기능을 꺼야함<br> [spellcheck](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/spellcheck)라는 global attribute 값을 `false`처리해서 기능을 사용하지 않음 처리함<br> **[문제해결]** 프로젝트 추가 후에 새로고침하면 project item 정렬이 뒤죽박죽이 됨. res.data.id를 콘솔에 찍어보면 순서대로 나오는데... <br>for ... of 문 안에서 호출하는 `projectItem()` 앞에 `await`를 추가했더니 순서대로 나옴<br> **[문제해결]** 프로젝트 추가 입력이나 프로젝트 타이틀 수정시에 enter 키를 누르거나 인풋에서 blur될때 다음 동작을 처리하고 싶은데 동작 부분을 함수로 정의하고 각각의 이벤트에 이벤트 핸들러로 넣었더니 (당연하지만...;;) 프로젝트가 중복 생성됨<br> enter 키 이벤트에서 인풋 엘리먼트에 `blur()` 메소드를 사용해 focus out되게 함으로써 blur 이벤트로 넘어가도록 처리함 |
| 180530 | **[문제해결]** `taskModal()`함수에 인자를 분할대입으로 받도록 했더니 같은 데이터를 넘겨받기 위해 똑같이 인자를 분할대입해서 받는 `taskItem()` 함수 안에서 `taskModal()`을 호출할 경우 다시 인자를 넘길때도 분할대입으로 해줘야했다.<br> / 강사님과 트러블 슈팅 시간에 이부분에 대해 객체를 인자로 넘겨받고 함수 내부에서 분할 대입을 해주는 게 어떻겠냐는 조언을 받아 수정했더니 훨씬 깔끔해졌다. <br> **[문제해결]** 화면을 새로 그리지 않는 모달의 경우 불러오는 동안 빠르게 다른 아이콘을 사용하면 모달을 중복으로 생성했다. 기존에 `promise`를 인자로 받아 loading 템플릿을 그렸다 제거하는 함수를 사용했다. <br> **[문제해결]** 라벨 자동완성(추천) 기능을 만들었는데, 기존 라벨을 선택하면 그 값을 인풋이나 라디오 버튼에 값을 넘겼더니 마지막에 submit시에 결국은 그 던져준 값으로 라벨을 생성하는 코드가 있어서 라벨이 중복으로 생성되었다. <br> / 이미 생겨난 라벨을 중복 생성하지 않고 재사용 가능하도록 UI를 아예 고쳐서 삭제 버튼이 있는 라벨 태그와 폼 부분이 바꿔치기 되도록 수정했다. label인풋값은 비워버리게 했다. (인풋의 값이 깨끗하다면 문제를 일으킨 코드 부분을 if문에 의해 걸러진다.) / <br> **[문제해결]** render() 함수에서 appenChild() 할 부모엘리먼트에서 참조 오류가 생겼다. 디버깅을 통해 타고 올라가니 전역 변수를 `body`같은 식으로 쓴것이 문제가 되었다. `body`는 전역 변수이름으로 쓰기 너무 위험한 이름이고(전역변수 자체가 좋지 않지만...) 또 응답 데이터를 인자로 던지는데 그 응답데이터 중 body가 있어서 충돌했다. 해당 부분은 `bodyEl`로 수정했다. <br> **[목표]** 시간만 되면 전역변수를 포함해 코드를 싹 수정하고 싶다. 목표한 데드라인 기능을 넣을 수 있을지 의문이다. 완료, 미완료, 전체 작업 정렬이나, 작업 검색 기능도 만들자 |