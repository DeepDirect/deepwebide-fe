# 🌐 Web IDE

React, TypeScript, Vite 기반의 실시간 웹 IDE입니다.  
실시간 코드 동시 편집, 채팅, 파일 업로드 및 다운로드, GitHub 로그인 기능을 제공합니다.

프로젝트 기간: 2025.07 ~ 2025.08 (기획 및 개발)  
Link: https://www.deepdirect.site/  
Code: [FE](https://github.com/DeepDirect/deepwebide-fe), [BE](https://github.com/DeepDirect/deepwebide-be)

---

## 🫶 팀원
| 이름      | 역할                 | GitHub 링크                                     |
|----------|--------------------|------------------------------------------------|
| 정원용     | 팀장, Full Stack    | [@projectmiluju](https://github.com/jihun-dev) |
| 권혜진     | Backend            | [@sunsetkk](https://github.com/sunsetkk)       |
| 박건      | Frontend            | [@Jammanb0](https://github.com/Jammanb0)       |
| 박소현     | Frontend           | [@ssoogit](https://github.com/ssoogit)         |
| 박재경     | Full Stack, Infra  | [@Shin-Yu-1](https://github.com/sunghoon-back) |
| 이은지     | Frontend           | [@ebbll](https://github.com/ebbll)             |
| 최범근     | Backend            | [@vayaconChoi](https://github.com/vayaconChoi) |

---

## 🚀 주요 기능
- 실시간 협업 코드 편집
- 실시간 채팅

---

## 🛠️ 기술 스택

### FE
| 분류            | 기술명                                                           |
|----------------|----------------------------------------------------------------|
| 프레임워크/런타임  | React + TypeScript                                              |
| 빌드 도구       | Vite, TypeScript (tsc)                                           |
| 상태 관리        | Zustand (클라이언트 상태), TanStack Query (서버 상태)                 |
| 라우팅          | TanStack Router (@tanstack/react-router)                        |
| 폼 관리/검증     | React Hook Form, Zod, @hookform/resolvers                       |
| 실시간          | Yjs, y-monaco, y-websocket, STOMP, SockJS                       |
| 코드 에디터      | Monaco Editor (@monaco-editor/react)                            |
| UI 라이브러리    | Radix UI (Toast, Tooltip, Switch, VisuallyHidden)               |
| Drag & Drop   | React DnD, react-dnd-html5-backend, @minoru/react-dnd-treeview  |
| 날짜 처리       | dayjs                                                            |
| 아이콘          | pixelarticons, clsx                                             |
| 네트워크 요청    | Axios                                                            |
| 스타일링        | SCSS                                                             |
| 코드 품질 도구   | ESLint, Prettier, Stylelint, Husky, lint-staged                  |

### BE
| 분류             | 사용 기술 / 라이브러리                              | 설명 |
|-----------------|------------------------------------------------------|------|
| 언어 및 프레임워크   | Java 17, Spring Boot 3.4.7                        | 백엔드 애플리케이션 기반 |
| 빌드 도구         | Gradle                                               | 의존성 및 빌드 관리 |
| 웹 서버           | Spring Web (`spring-boot-starter-web`)              | REST API 및 MVC 구성 |
| 보안             | Spring Security, JWT (`jjwt`), OAuth2 Client        | 로그인, 인증, 인가 처리 |
| 데이터베이스       | MySQL, Spring Data JPA (`hibernate`)                | 사용자 및 저장소 관리용 RDB |
| 실시간 통신       | WebSocket (`spring-websocket`), STOMP, SockJS       | 채팅, 동시 편집용 실시간 통신 |
| Redis           | Lettuce (`lettuce-core`), Spring Data Redis         | 토큰 저장, Pub/Sub 등 |
| 파일 업로드       | AWS S3 SDK (v1, v2 혼용)                            | 코드 파일 업로드/다운로드 |
| 이메일 발송       | Spring Mail (`spring-boot-starter-mail`)            | 이메일 인증, 알림 전송 |
| 문자 인증        | Coolsms SDK (`net.nurigo:sdk`)                      | 전화번호 인증 (SMS) |
| API 문서화      | SpringDoc OpenAPI (`springdoc-openapi`)             | Swagger 기반 자동 API 문서 |
| 모니터링        | Spring Boot Actuator                                | Health Check 등 메트릭 제공 |
| 에러 추적       | Sentry (`sentry-spring-boot-starter`, logback 연동) | 런타임 에러 실시간 추적 |
| 로깅 유틸리티    | Logback, Commons IO                                  | 로깅, 파일 유틸리티 |

---

## 📸 Screenshots


---

## 📁 FE 디렉토리 구조
```bash
src/
├── api/ # API 요청 함수 정의 (axios 등과 연동)
├── assets/ # 이미지 등 정적 리소스
├── components/ # 재사용 가능한 UI 컴포넌트
├── constants/ # 공통 상수 정의
├── features/ # 도메인 단위의 기능 모듈
├── hooks/ # 커스텀 React Hook 모음
├── layouts/ # 페이지 공통 레이아웃 컴포넌트
├── mocks/ # Mock 데이터 (개발/테스트 용)
├── pages/ # 라우팅되는 페이지 컴포넌트
├── router/ # TanStack Router 관련 라우터 설정
├── schemas/ # Zod 기반 스키마 (요청/응답 타입 정의 포함)
├── stores/ # Zustand 상태 저장소
├── styles/ # 전역 스타일 정의 (reset, theme 등)
├── types/ # 전역 타입 정의 (TypeScript interface/type 모음)
└── utils/ # 공통 유틸리티 함수
```

---

## 🏃‍➡️ 설치 및 실행
```bash
# 패키지 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build
```