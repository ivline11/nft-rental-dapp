import { useState } from 'react';
import { Theme, Card, Text, Flex, Button, TextField } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';
import { useKiosk } from '../hooks/useKiosk';

// NFT 타입 정의 수정
interface NFTData {
  id: string | undefined;
  type?: string | null;
  content?: {
    dataType: string;
    fields?: {
      [key: string]: any;
      name?: string;
      description?: string;
      price_per_day?: string;
      duration?: string;
      url?: string;
    };
  } | null;
}

export function RentNFT() {
  const { rentableNFTs, isLoadingRentableNFTs, rentNFT } = useNFTRental();
  const { kioskData } = useKiosk();
  const [rentalPolicyId, setRentalPolicyId] = useState('');
  const [renterKioskId, setRenterKioskId] = useState('');
  
  const handleRent = async (nftId: string | undefined, pricePerDay: number, duration: number) => {
    if (!kioskData) {
      alert('Kiosk가 설정되지 않았습니다. Kiosk 설정 페이지로 이동하세요.');
      return;
    }
    
    if (!nftId) {
      alert('유효하지 않은 NFT ID입니다.');
      return;
    }
    
    try {
      const totalPrice = pricePerDay * duration;
      
      await rentNFT.mutateAsync({
        renterKioskId,
        borrowerKioskId: kioskData.kioskId,
        rentalPolicyId,
        nftId,
        totalPrice,
      });
      
      alert('NFT 대여에 성공했습니다!');
    } catch (error) {
      console.error('NFT 대여 실패:', error);
      alert(`NFT 대여 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };
  
  // NFT 데이터 안전하게 접근하는 함수
  const getNFTField = (nft: NFTData, field: string): string => {
    if (nft.content?.dataType === 'moveObject' && nft.content?.fields) {
      return nft.content.fields[field] || '';
    }
    return '';
  };
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">NFT 대여하기</Text>
          
          <Flex direction="column" gap="1">
            <Text size="2">대여자 Kiosk ID</Text>
            <TextField.Root
              value={renterKioskId}
              onChange={(e) => setRenterKioskId(e.target.value)}
              placeholder="대여자 Kiosk ID를 입력하세요"
              required
            />
          </Flex>
          
          <Flex direction="column" gap="1">
            <Text size="2">Rental Policy ID</Text>
            <TextField.Root
              value={rentalPolicyId}
              onChange={(e) => setRentalPolicyId(e.target.value)}
              placeholder="Rental Policy ID를 입력하세요"
              required
            />
          </Flex>
          
          {isLoadingRentableNFTs ? (
            <Text>대여 가능한 NFT 로딩 중...</Text>
          ) : rentableNFTs && rentableNFTs.length > 0 ? (
            <Flex direction="column" gap="2">
              <Text size="3" weight="bold">대여 가능한 NFT 목록</Text>
              {rentableNFTs.map((nft) => (
                <Card key={nft.id}>
                  <Flex direction="column" gap="2">
                    <Text>{getNFTField(nft, 'name') || nft.id || 'Unnamed NFT'}</Text>
                    <Text size="2">{getNFTField(nft, 'description')}</Text>
                    <Text size="2">가격: {getNFTField(nft, 'price_per_day')} MIST/일</Text>
                    <Text size="2">기간: {getNFTField(nft, 'duration')}일</Text>
                    <Button onClick={() => handleRent(
                      nft.id,
                      parseInt(getNFTField(nft, 'price_per_day') || '0'),
                      parseInt(getNFTField(nft, 'duration') || '0')
                    )} disabled={rentNFT.isPending}>
                      {rentNFT.isPending ? '대여 중...' : '대여하기'}
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Flex>
          ) : (
            <Text>대여 가능한 NFT가 없습니다.</Text>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 