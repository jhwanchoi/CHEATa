# 치타 (Cheata) - AI 기반 가짜뉴스 탐지 크롬 확장 프로그램

<div align="center">
  <img src="assets/icon.png" alt="Cheata Logo" width="128" height="128">
  <br>
  <h3>사실 확인과 허위 정보 탐지를 위한 AI 파워 크롬 확장 프로그램</h3>
</div>

## 📑 목차

- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [설치 방법](#-설치-방법)
- [개발 환경 설정](#-개발-환경-설정)
- [프로젝트 구조](#-프로젝트-구조)
- [API 사용법](#-api-사용법)
- [CI/CD 파이프라인](#-cicd-파이프라인)
- [라이센스](#-라이센스)

## 📝 소개

**치타(Cheata)**는 웹 페이지상의
텍스트를 분석하여 가짜 뉴스나 허위 정보를 탐지하는 크롬 확장 프로그램입니다. GPT-4 기반 AI 기술을 활용하여 사용자가 읽고 있는 정보의 신뢰성을 빠르게 확인할 수 있습니다.

## ✨ 주요 기능

- 웹 페이지에서 텍스트 선택 후 원클릭으로 분석 요청
- AI 기반 텍스트 신뢰성 평가
- 가짜 정보 가능성과 신뢰도 점수 제공
- 분석 결과에 대한 간단한 설명 제공
- 사용자 친화적 인터페이스

## 🛠 기술 스택

### 프론트엔드 (크롬 확장 프로그램)
- **TypeScript** - 타입 안정성을 갖춘 JavaScript 슈퍼셋
- **React** - UI 컴포넌트 라이브러리
- **TailwindCSS** - 유틸리티 우선 CSS 프레임워크
- **Plasmo** - 브라우저 확장 프로그램 개발 프레임워크

### 백엔드 (API 서버)
- **Python** - 백엔드 프로그래밍 언어
- **FastAPI** - 고성능 API 프레임워크
- **Uvicorn** - ASGI 서버
- **OpenAI API** - GPT-4 모델 사용

### 개발 도구
- **ESLint & Prettier** - JavaScript/TypeScript 코드 린팅 및 포맷팅
- **Black** - Python 코드 포맷팅
- **GitHub Actions** - CI/CD 자동화

## 📥 설치 방법

### 크롬 확장 프로그램 설치 (개발 버전)

1. 이 저장소를 클론합니다:
   ```bash
   git clone https://github.com/yourusername/cheata.git
   cd cheata
   ```

2. 의존성을 설치하고 빌드합니다:
   ```bash
   npm install
   npm run build
   ```

3. 크롬 브라우저를 열고 `chrome://extensions/`로 이동합니다.
4. 우측 상단의 '개발자 모드'를 활성화합니다.
5. '압축해제된 확장 프로그램을 로드합니다' 버튼을 클릭합니다.
6. `build/chrome-mv3-dev` 폴더를 선택합니다.

## 🧑‍💻 개발 환경 설정

### 프론트엔드 (크롬 확장 프로그램)

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 코드 린팅:
   ```bash
   npm run lint
   ```

3. 코드 포맷팅:
   ```bash
   npm run format
   ```

### 백엔드 (API 서버)

1. Python 가상 환경 설정:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   ```

2. 환경 변수 설정:
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 OPENAI_API_KEY 추가
   ```

3. 서버 실행:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

4. API 문서 접근:
   ```
   http://localhost:8000/docs
   ```

## 📁 프로젝트 구조

```
cheata/
├── src/                      # 프론트엔드 소스 코드
│   ├── components/           # React 컴포넌트
│   ├── api/                  # API 호출 관련 코드
│   ├── background/           # 백그라운드 스크립트
│   ├── contents/             # 콘텐츠 스크립트
│   └── utils/                # 유틸리티 함수
│
├── backend/                  # 백엔드 API 서버
│   ├── app/
│   │   ├── main.py           # FastAPI 앱
│   │   └── ai_service.py     # OpenAI API 연동 서비스
│   ├── requirements.txt      # Python 의존성
│   └── Dockerfile            # 백엔드 배포용 Dockerfile
│
├── .github/
│   └── workflows/            # GitHub Actions CI/CD 설정
│       └── ci-cd.yml
│
├── .eslintrc.js              # ESLint 설정
├── postcss.config.js         # PostCSS 설정
├── tailwind.config.js        # TailwindCSS 설정
├── package.json              # npm 패키지 정보
└── README.md                 # 프로젝트 설명서
```

## 🔌 API 사용법

### 텍스트 분석 API 엔드포인트

**URL**: `http://localhost:8000/analyze`  
**메소드**: `POST`  
**요청 바디**:

```json
{
  "text": "분석할 텍스트 내용"
}
```

**응답**:

```json
{
  "isFake": true,
  "confidence": 85,
  "explanation": "이 텍스트는 여러 사실적 오류를 포함하고 있으며, 감정적 언어를 사용하여 독자를 조작하려는 시도가 보입니다. 신뢰할 수 있는 출처를 인용하지 않으며, 내용 중 여러 주장이 서로 모순됩니다."
}
```

## 🚀 CI/CD 파이프라인

이 프로젝트는 GitHub Actions를 사용하여 CI/CD 파이프라인을 구성했습니다:

1. **코드 린팅**: ESLint(프론트엔드)와 Black(백엔드)를 사용한 코드 품질 검사
2. **빌드 테스트**: 크롬 확장 프로그램 빌드 검증
3. **백엔드 테스트**: Python 백엔드 API 테스트 실행
4. **패키징**: 메인 브랜치 푸시 시 자동 패키징

GitHub Actions 워크플로우는 `.github/workflows/ci-cd.yml` 파일에 정의되어 있습니다.

## 📄 라이센스

MIT License 