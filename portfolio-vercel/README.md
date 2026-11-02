# 게임 사업PM 포트폴리오 (Vercel 버전)

- **공개 페이지** `/` : 채용 담당자가 보는 포트폴리오
- **관리자 페이지** `/admin` : 비밀번호로 로그인해서 내용 입력·이미지 업로드 → 저장하면 바로 반영

## 구조
```
├── index.html        공개 페이지
├── admin.html        관리자 입력 페이지
├── css/style.css     공통 디자인 (색은 맨 위 :root 에서 변경)
├── css/admin.css     관리자 페이지 디자인
├── js/main.js        공개 페이지 화면 그리기
├── js/admin.js       관리자 입력/저장 기능 (입력칸 추가는 *_FIELDS 목록에 한 줄 추가)
├── js/data.js        첫 저장 전에 보이는 샘플 데이터
├── api/              서버 기능 (Vercel이 자동 실행)
│   ├── data.js       데이터 불러오기/저장 (저장할 때마다 기록이 쌓임, 최근 30개 보관)
│   ├── upload.js     이미지 업로드
│   ├── versions.js   저장 기록 목록
│   └── auth.js       관리자 로그인 확인
├── package.json
└── vercel.json
```

## 배포 순서 (처음 1번만)
1. **GitHub**에 새 저장소를 만들고 이 폴더 안의 파일을 모두 올립니다. (`node_modules` 폴더는 올리지 않음)
2. **vercel.com** → GitHub로 로그인 → `Add New → Project` → 방금 만든 저장소 `Import`
   - Framework Preset: **Other** 그대로 → `Deploy`
3. 프로젝트 화면 → **Storage** → `Create` → **Blob** 선택
   - 접근 방식은 반드시 **Public** 으로 선택 (이미지를 누구나 볼 수 있어야 하므로)
   - 환경: Production / Preview 체크 → 만들기
4. 프로젝트 **Settings → Environment Variables** 에 추가
   - Key: `ADMIN_PASSWORD` / Value: 본인만 아는 비밀번호 (12자 이상 추천)
5. **Deployments** 탭 → 최신 배포 `⋯` → **Redeploy** (환경변수 적용)
6. `https://프로젝트명.vercel.app/admin` 접속 → 비밀번호로 로그인 → 내용 입력 → **저장**

## 사용법
- 저장: `저장` 버튼 또는 `Ctrl+S` (Mac은 `⌘+S`)
- 게임 캡쳐: 여러 장 한 번에 선택 가능, 자동으로 1600px로 줄여서 올라감. ★ 누르면 대표 이미지로 변경
- 삭제 버튼은 **두 번** 눌러야 지워집니다 (실수 방지)
- `저장 기록` 탭: 예전 저장본 불러오기 / JSON 백업 내려받기·불러오기
- 방문자 화면은 최대 30초 캐시되므로, 저장 직후 바로 안 바뀌면 잠시 후 새로고침

## 참고
- Vercel 무료(Hobby) 플랜과 Blob 무료 사용량으로 개인 포트폴리오는 충분히 운영됩니다.
- GitHub에 코드를 고쳐서 올리면 Vercel이 자동으로 다시 배포합니다. 입력한 데이터는 Blob에 있으므로 재배포해도 사라지지 않습니다.
