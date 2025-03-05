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

### 3. NFT 생성
- NFT 생성 → NFT 이름, 설명, 이미지 URL 입력 → 생성 완료

### 4. NFT Kiosk에 추가

### 5. NFT 대여 등록(Renter)
- NFT 대여 등록 → NFT 선택 → 대여 기간 및 가격 설정 → 등록 완료

### 6. NFT 대여(Borrower)
- NFT 대여 → 대여 가능한 NFT 목록 확인 → NFT 선택 → 대여 완료

### 7. NFT 반환(Borrower)
- NFT 반환 → 대여한 NFT 목록 확인 → NFT 선택 → 반환 완료
