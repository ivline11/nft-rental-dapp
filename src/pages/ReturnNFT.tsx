import { useState, useEffect } from 'react';
import { Theme, Card, Text, Flex, Button } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';
import { useKiosk } from '../hooks/useKiosk';
import { useSuiClient } from '@mysten/dapp-kit';

// NFT 타입 정의
interface NFTData {
  id: string | undefined;
  type?: string | null;
  content?: {
    dataType: string;
    fields?: {
      [key: string]: any;
      name?: string;
      description?: string;
      url?: string;
    };
  } | null;
}

export function ReturnNFT() {
  const client = useSuiClient();
  const { returnNFT } = useNFTRental();
  const { kioskData } = useKiosk();
  const [rentedNFTs, setRentedNFTs] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRentedNFTs = async () => {
      if (!kioskData) return;
      
      setIsLoading(true);
      try {
        // 여기서는 간단하게 구현합니다. 실제로는 더 복잡한 쿼리가 필요할 수 있습니다.
        const objects = await client.getOwnedObjects({
          owner: kioskData.kioskId,
          options: { showContent: true },
        });
        
        setRentedNFTs(objects.data.map(obj => ({
          id: obj.data?.objectId,
          type: obj.data?.type,
          content: obj.data?.content,
        })));
      } catch (error) {
        console.error('대여한 NFT 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRentedNFTs();
  }, [kioskData, client]);
  
  // NFT 데이터 안전하게 접근하는 함수
  const getNFTField = (nft: NFTData, field: string): string => {
    if (nft.content?.dataType === 'moveObject' && nft.content?.fields) {
      return nft.content.fields[field] || '';
    }
    return '';
  };
  
  const handleReturn = async (nftId: string | undefined) => {
    if (!kioskData) {
      alert('Kiosk가 설정되지 않았습니다. Kiosk 설정 페이지로 이동하세요.');
      return;
    }
    
    if (!nftId) {
      alert('유효하지 않은 NFT ID입니다.');
      return;
    }
    
    try {
      await returnNFT.mutateAsync({
        borrowerKioskId: kioskData.kioskId,
        borrowerKioskCapId: kioskData.kioskCapId,
        nftId,
      });
      
      // 목록 업데이트
      setRentedNFTs(rentedNFTs.filter(nft => nft.id !== nftId));
      
      alert('NFT 반환에 성공했습니다!');
    } catch (error) {
      console.error('NFT 반환 실패:', error);
      alert(`NFT 반환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">대여한 NFT 반환하기</Text>
          
          {isLoading ? (
            <Text>대여한 NFT 로딩 중...</Text>
          ) : rentedNFTs.length > 0 ? (
            <Flex direction="column" gap="2">
              <Text size="3" weight="bold">대여한 NFT 목록</Text>
              {rentedNFTs.map(nft => (
                <Card key={nft.id}>
                  <Flex direction="column" gap="2">
                    <Text>{getNFTField(nft, 'name') || nft.id || 'Unnamed NFT'}</Text>
                    <Text size="2">{getNFTField(nft, 'description')}</Text>
                    <Button onClick={() => handleReturn(nft.id)} disabled={returnNFT.isPending}>
                      {returnNFT.isPending ? '반환 중...' : '반환하기'}
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Flex>
          ) : (
            <Text>대여한 NFT가 없습니다.</Text>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 