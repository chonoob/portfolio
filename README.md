# 군산새빛유치원 온라인 서류 접수 미리보기 방법

미리보기가 안 뜨는 경우, 아래처럼 **로컬 웹서버**로 실행해서 확인하세요.

## 1) 프로젝트 폴더로 이동
```bash
cd /workspace/portfolio
```

## 2) 정적 서버 실행 (Python)
```bash
python3 -m http.server 4173
```

## 3) 브라우저에서 접속
- `http://localhost:4173`
- 또는 `http://127.0.0.1:4173`

> 터미널에 `Serving HTTP on ...`가 보이면 정상 실행입니다.

## 4) 관리자 화면 확인
- 상단에서 **관리자 확인** 탭 클릭
- PIN 입력: `admin1234`

## 5) 자주 있는 문제
- 코드 파일 내용만 보일 때: `index.html`을 파일로 직접 열지 말고, 위처럼 웹서버 URL로 접속하세요.
- 포트 충돌 시:
  ```bash
  python3 -m http.server 5173
  ```
  이후 `http://localhost:5173` 접속.

## 6) 서버 종료
실행한 터미널에서 `Ctrl + C`
