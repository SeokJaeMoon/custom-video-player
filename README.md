# HTML5 커스텀 비디오 플레이어

HTML5 `<video>` + CSS3 + Vanilla JavaScript만 사용한 커스텀 플레이어입니다. 프레임워크, 번들러, 백엔드가 필요하지 않습니다.

## 파일 구조

```text
custom_video_player/
├── index.html       # 비디오 태그, 버튼, range 컨트롤
├── style.css        # 반응형 UI / 프로그레스 바 디자인
├── script.js        # Media API, Seeking, 이벤트, requestAnimationFrame
├── media/
│   └── demo.mp4     # 이 프로젝트에 포함된 자체 제작 데모 영상
└── README.md
```

## 크롬에서 GitHub Pages로 배포

1. `https://github.com` 로그인 → 우측 상단 `+` → `New repository` 선택.
2. 저장소 이름을 예를 들어 `custom-video-player`로 지정하고 `Public` 선택 → `Create repository`.
3. 저장소의 `Add file` → `Upload files` 선택.
4. 압축파일을 업로드하지 말고, 압축을 푼 폴더 **내부**의 `index.html`, `style.css`, `script.js`, `media/` 폴더를 업로드합니다. `index.html`이 저장소 최상위에 있어야 합니다.
5. `Commit changes` 클릭.
6. `Settings` → `Pages` → `Build and deployment` → `Source: Deploy from a branch`.
7. `Branch: main`, `Folder: /(root)` → `Save`.
8. 공개된 `https://사용자이름.github.io/custom-video-player/`에 접속하여 실행.

## 동작 기능

- 재생 / 일시정지 (`video.play()`, `video.pause()`)
- 볼륨 조절 / 음소거 (`video.volume`, `video.muted`)
- 재생 위치 조절 (`video.currentTime`)
- 재생 시간, 전체 영상 길이 표시
- 재생 중 `requestAnimationFrame`을 통해 진행 바 동기화, 일시정지/종료 시 `cancelAnimationFrame`
- 전체 화면 및 재생 속도 변경
- 로컬 비디오 임시 재생: `내 영상 열기` 버튼 (`URL.createObjectURL`)
- 키보드 단축키: 플레이어에 포커스한 상태에서 `Space`, 좌우 방향키, `M`

## 동영상 교체

저장소의 `media/demo.mp4`를 원하는 동영상으로 교체하거나, `index.html`의 `<video src="./media/demo.mp4">` 경로를 변경합니다. 경로의 대소문자는 구분됩니다. 저장소에 포함된 공개 영상은 누구나 접근할 수 있으므로 저작권 및 개인정보에 유의합니다.

> `내 영상 열기`는 사용자의 PC에서 파일을 **임시로 재생**할 뿐, GitHub 서버에 업로드하지 않습니다.

## 구조 설명

`script.js`는 기능별로 PlayerView(화면 렌더링)와 PlayerController(입력 처리 및 재생 API) 역할을 나누어 설계했습니다. 실제 재생 위치와 상태는 `<video>` 요소에서 읽으며, 상태가 바뀔 때 UI가 동기화됩니다.

브라우저의 자동 재생 정책과 코덱 지원 여부에 따라 재생 동작이 달라질 수 있습니다. MP4(H.264/AAC)는 일반적인 크롬 사용 환경에 적합합니다.

## 비고

`media/demo.mp4`는 실습을 위해 직접 생성한 자체 제작 영상입니다.
