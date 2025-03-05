import { Link } from 'react-router-dom';
import { Flex } from '@radix-ui/themes';

export function Navigation() {
  return (
    <nav>
      <Flex gap="3">
        <Link to="/">홈</Link>
        <Link to="/create-nft">NFT 생성</Link>
        <Link to="/nft-list">내 NFT 목록</Link>
        <Link to="/kiosk-setup">Kiosk 설정</Link>
        <Link to="/kiosk-nfts">Kiosk NFT 목록</Link>
      </Flex>
    </nav>
  );
} 