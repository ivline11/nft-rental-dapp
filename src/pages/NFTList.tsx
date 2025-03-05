import { useEffect } from 'react';
import { Theme, Card, Text, Flex, Button, Grid } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';
import { useKiosk } from '../hooks/useKiosk';

export function NFTList() {
  const { userNFTs, isLoadingUserNFTs, addNFTToKiosk } = useNFTRental();
  const { kioskData } = useKiosk();
  
  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log("NFTList 컴포넌트 마운트됨");
    console.log("userNFTs:", userNFTs);
    console.log("isLoadingUserNFTs:", isLoadingUserNFTs);
    console.log("kioskData:", kioskData);
  }, [userNFTs, isLoadingUserNFTs, kioskData]);
  
  const handleAddToKiosk = (nftId: string) => {
    if (!kioskData) {
      alert("먼저 Kiosk를 설정해야 합니다.");
      // 탭 변경 대신 알림만 표시
      return;
    }
    
    if (!kioskData.hasRentablesExt) {
      alert("먼저 Rentables 확장을 설치해야 합니다.");
      // 탭 변경 대신 알림만 표시
      return;
    }
    
    addNFTToKiosk.mutate({
      nftId,
      kioskId: kioskData.kioskId,
      kioskCapId: kioskData.kioskCapId,
    });
  };
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">내 NFT 목록</Text>
          
          {isLoadingUserNFTs ? (
            <Text>NFT 정보 로딩 중...</Text>
          ) : userNFTs && userNFTs.length > 0 ? (
            <Grid columns="3" gap="3">
              {userNFTs.map((nft) => (
                <Card key={nft.id}>
                  <Flex direction="column" gap="2">
                    {/* 이미지 대신 NFT 정보 카드 표시 */}
                    <div style={{ 
                      width: '100%', 
                      height: '150px', 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <Text size="4" weight="bold" style={{ marginBottom: '8px' }}>
                        {nft.name || "이름 없음"}
                      </Text>
                      <Text size="2" style={{ color: '#666', flex: 1, overflow: 'hidden' }}>
                        {nft.description || "설명 없음"}
                      </Text>
                      <Text size="1" style={{ color: '#999', marginTop: '8px' }}>
                        ID: {nft.id?.substring(0, 10)}...
                      </Text>
                    </div>
                    
                    <Button 
                      onClick={() => handleAddToKiosk(nft.id || '')}
                      disabled={addNFTToKiosk.isPending}
                      color="blue"
                    >
                      {addNFTToKiosk.isPending ? '처리 중...' : 'Kiosk에 추가'}
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Grid>
          ) : (
            <Flex direction="column" gap="3" align="center" style={{ padding: '20px' }}>
              <Text>NFT가 없습니다. 새 NFT를 생성해보세요.</Text>
              <Button onClick={() => document.querySelector('[value="create"]')?.dispatchEvent(new MouseEvent('click'))}>
                NFT 생성하기
              </Button>
            </Flex>
          )}
          
          {!kioskData && (
            <Card style={{ marginTop: '20px', backgroundColor: '#f9f9f9' }}>
              <Flex direction="column" gap="2">
                <Text weight="bold">Kiosk가 설정되지 않았습니다</Text>
                <Text size="2">NFT를 Kiosk에 추가하려면 먼저 Kiosk를 설정해야 합니다.</Text>
                <Button onClick={() => document.querySelector('[value="kiosk"]')?.dispatchEvent(new MouseEvent('click'))}>
                  Kiosk 설정하기
                </Button>
              </Flex>
            </Card>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 