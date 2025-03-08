export const PACKAGE_ID = "";
export const MODULE_NAME = "rentables_ext";
export const NFT_MODULE_NAME = "simple_nft";
export const NFT_TYPE = `${PACKAGE_ID}::simple_nft::NFT`;
export const OWNER_ID = "";
export const PUBLISHER_ID = ""; // 패키지 배포 시 안에 있음

// Protected TP 타입 및 ID
// 기존 TRANSFER_POLICY_ID를 PROTECTED_TP_ID로 변경하고 올바른 값 설정
export const PROTECTED_TP_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::ProtectedTP<${NFT_TYPE}>`;
export const PROTECTED_TP_ID = ""; // setup_renting 트랜잭션에서 생성된 객체의 ID

// Sui 시스템 객체
export const CLOCK_ID = "0x6";