import { useState } from 'react';
import { Theme, Card, Text, Flex, Button, TextField } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';
import { useKiosk } from '../hooks/useKiosk';


export function RentNFT() {
  const { rentableNFTs, isLoadingRentableNFTs, rentNFT } = useNFTRental();
  const { kioskData } = useKiosk();
  const [nftId, setNftId] = useState('');
  const [kioskId, setKioskId] = useState('');
  const [policyId, setPolicyId] = useState('');
  
  const handleRent = async (
    renterKioskId: string | undefined,
    rentalPolicyId: string | undefined,
    nftId: string | undefined
  ) => {
    if (!kioskData) {
      alert('Kiosk가 설정되지 않았습니다. Kiosk 설정 페이지로 이동하세요.');
      return;
    }
    
    if (!renterKioskId || !rentalPolicyId || !nftId) {
      alert('모든 ID를 입력해주세요.');
      return;
    }

    // rentableNFTs에서 해당 NFT 찾기
    const rentableNFT = rentableNFTs?.find(nft => nft?.nftId === nftId);
    if (!rentableNFT) {
      alert('대여 가능한 NFT를 찾을 수 없습니다.');
      return;
    }

    // totalPrice 계산
    const totalPrice = rentableNFT.pricePerDay * rentableNFT.duration;
    
    try {
      await rentNFT.mutateAsync({
        renterKioskId,
        borrowerKioskId: kioskData.kioskId,
        rentalPolicyId,
        nftId,
        totalPrice
      });
      
      alert('NFT 대여에 성공했습니다!');
    } catch (error) {
      console.error('NFT 대여 실패:', error);
      alert(`NFT 대여 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  
  // 콘솔에 로그 추가
  console.log("Rentable NFTs:", rentableNFTs);
  console.log("Loading state:", isLoadingRentableNFTs);

  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="4">
          <Text size="3" weight="bold">NFT 대여하기</Text>
          
          {/* 현재 지갑의 Kiosk ID 표시 */}
          <Text>내 Kiosk ID: {kioskData?.kioskId || '없음'}</Text>
          
          <Card>
            <Flex direction="column" gap="2">
              <TextField.Root
                placeholder="대여할 NFT의 ID"
                onChange={(e) => setNftId(e.target.value)}
              />
              <TextField.Root
                placeholder="NFT 소유자의 Kiosk ID"
                onChange={(e) => setKioskId(e.target.value)}
              />
              <TextField.Root
                placeholder="Rental Policy ID"
                onChange={(e) => setPolicyId(e.target.value)}
              />
              <Button 
                onClick={() => handleRent(kioskId, policyId, nftId)} 
                disabled={rentNFT.isPending || !nftId || !kioskId || !policyId}
              >
                {rentNFT.isPending ? '대여 중...' : '대여하기'}
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Card>
    </Theme>
  );
} 