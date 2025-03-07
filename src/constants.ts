export const PACKAGE_ID = "0x74ac87a4e2d44f3b1712bc527a18796b10bd47bddccaa93ce203ae29fca2ab53";
export const MODULE_NAME = "rentables_ext";
export const NFT_MODULE_NAME = "simple_nft";
export const NFT_TYPE = `${PACKAGE_ID}::simple_nft::NFT`;
export const OWNER_ID = "0x12a61583825348beed75df14e2eaa86b9233ac4a64aa8c980710c892d56e088f";
export const PUBLISHER_ID = "0xd2488b5b59fefd3cb17fd99fb31da464ecd5e94227b9d19f4eafb4e556eeeefb"; // 패키지 배포 시 안에 있음

// Protected TP 타입 및 ID
// 기존 TRANSFER_POLICY_ID를 PROTECTED_TP_ID로 변경하고 올바른 값 설정
export const PROTECTED_TP_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::ProtectedTP<${NFT_TYPE}>`;
export const PROTECTED_TP_ID = "0xb1e2d3c6afc6743986f96d5f7996eb6d305f8d91f0d01d3921e8200e15f25d24"; // setup_renting 트랜잭션에서 생성된 객체의 ID

// Sui 시스템 객체
export const CLOCK_ID = "0x6"; 