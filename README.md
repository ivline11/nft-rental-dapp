# nft rental dapp

This dApp was created using `@mysten/create-dapp` that sets up a basic React
Client dApp using the following tools:

- [React](https://react.dev/) as the UI framework
- [TypeScript](https://www.typescriptlang.org/) for type checking
- [Vite](https://vitejs.dev/) for build tooling
- [Radix UI](https://www.radix-ui.com/) for pre-built UI components
- [ESLint](https://eslint.org/)
- [`@mysten/dapp-kit`](https://sdk.mystenlabs.com/dapp-kit) for connecting to
  wallets and loading data
- [pnpm](https://pnpm.io/) for package management

## Starting your dApp

To install dependencies you can run

```bash
pnpm install
```

To start your dApp in development mode run

```bash
pnpm dev
```

## Building

To build your app for deployment you can run

```bash
pnpm build
```

## 순서
### 1. 지갑 연결

### 2. Kiosk 설정
- Kiosk 설정 → Kiosk 생성 → Rentables 확장 설치

### 3. NFT 생성 및 Publisher 설정
- 렌탈 정책 설정
- 트랜잭션 확인해서 PROTECTED_TP_ID 확인
- NFT 생성 → NFT 이름, 설명, 이미지 URL 입력 → 생성 완료

### 4. NFT Kiosk에 추가
- NFT를 Kiosk에 배치 또는 잠금

### 5. NFT 대여 등록(Renter)
- NFT 대여 등록 → NFT 선택 → 대여 기간 및 가격 설정 → 등록 완료
- 트랜잭션 확인해서 Listed 잘 되었나 확인

### 6. NFT 대여(Borrower)
- NFT 대여 → 대여 가능한 NFT 목록 확인 → NFT 선택 → 대여 완료

### 7. NFT 사용 및 반환(Borrower)
- 대여한 NFT 사용 (borrow 또는 borrow_val)
- NFT 반환 → 대여한 NFT 목록 확인 → NFT 선택 → 반환 완료

### 8. NFT 회수(Renter, 선택적)
- 대여 기간 종료 후 → NFT 회수 (reclaim)
