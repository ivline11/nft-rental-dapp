export const PACKAGE_ID = "0xfdbd336098e6b7800ff127a0652be8d449c120462b925655662d0cce88d0d2c0";
export const MODULE_NAME = "rentables_ext";
export const NFT_MODULE_NAME = "simple_nft";
export const NFT_TYPE = `${PACKAGE_ID}::simple_nft::NFT`;
export const OWNER_ID = "0xd57b60d2b12fce48451837a75be968db70e2245194cecfc66afb8c49009a2f57";
export const PUBLISHER_ID = "0xd14dcc5be0722443ea1bd8ce1add10d09fa78740c0997dbaf089c541a540e251"; // 패키지 배포 시 안에 있음

// Protected TP 타입 및 ID
// 기존 TRANSFER_POLICY_ID를 PROTECTED_TP_ID로 변경하고 올바른 값 설정
export const PROTECTED_TP_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::ProtectedTP<${NFT_TYPE}>`;
export const PROTECTED_TP_ID = "0ff725dea5fddc577516b73821f6e1f32245d31d47ede0c5e77f4a86a"; // setup_renting 트랜잭션에서 생성된 객체의 ID

// Sui 시스템 객체
export const CLOCK_ID = "0x6";