import { useState, useEffect } from 'react';
import { Theme, Card, Text, Flex, Button, Grid } from '@radix-ui/themes';
import { useKiosk } from '../hooks/useKiosk';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { NFT_TYPE } from '../constants';

// NFT 타입 정의 (이미지 URL 제거)
interface NFTData {
  id: string;
  name: string;
  description: string;
}

export function KioskNFTs() {
  const { kioskData, isLoadingKiosk } = useKiosk();
  const client = useSuiClient();
  const account = useCurrentAccount();
  const [kioskNFTs, setKioskNFTs] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchKioskNFTs = async () => {
      if (!kioskData || !kioskData.kioskId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Kiosk의 다이나믹 필드 조회
        const dynamicFields = await client.getDynamicFields({
          parentId: kioskData.kioskId
        });
        
        // NFT 객체 정보 가져오기
        const nfts: NFTData[] = [];
        
        for (const field of dynamicFields.data) {
          // 필드 값 조회
          const fieldObj = await client.getDynamicFieldObject({
            parentId: kioskData.kioskId,
            name: field.name
          });
          
          // 필드 타입이 NFT인 경우만 처리
          // SuiParsedData 타입 안전하게 접근
          const content = fieldObj.data?.content;
          let typeStr = "";
          
          if (content && typeof content === 'object') {
            // moveObject인 경우 type 속성 접근
            if ('dataType' in content && content.dataType === 'moveObject' && 'type' in content) {
              typeStr = content.type as string;
            }
          }
          
          // NFT 타입인지 확인
          if (typeStr && typeStr.includes('::nft::')) {
            // NFT 객체 ID 추출
            const nftId = fieldObj.data?.objectId;
            if (!nftId) continue;
            
            // NFT 객체 정보 조회
            const nftObj = await client.getObject({
              id: nftId,
              options: { showContent: true }
            });
            
            // NFT 데이터 추출
            const nftContent = nftObj.data?.content;
            const nftData: NFTData = {
              id: nftId,
              name: "Unknown NFT",
              description: "",
            };
            
            // content에서 정보 추출
            if (nftContent && typeof nftContent === 'object' && 'fields' in nftContent) {
              const fields = nftContent.fields as any;
              
              // 타입 안전하게 필드 접근
              if (fields) {
                // fields가 객체인 경우
                if (typeof fields === 'object') {
                  // fields가 배열인 경우 (MoveValue[])
                  if (Array.isArray(fields)) {
                    // 배열에서 필드 찾기
                    for (const field of fields) {
                      if (field && typeof field === 'object' && 'key' in field && 'value' in field) {
                        if (field.key === 'name') nftData.name = String(field.value);
                        if (field.key === 'description') nftData.description = String(field.value);
                      }
                    }
                  } 
                  // fields가 객체인 경우
                  else {
                    // 직접 속성 접근
                    if ('name' in fields) nftData.name = String(fields.name);
                    if ('description' in fields) nftData.description = String(fields.description);
                  }
                }
              }
            }
            
            nfts.push(nftData);
          }
        }
        
        setKioskNFTs(nfts);
        setIsLoading(false);
      } catch (error) {
        console.error("Kiosk NFT 조회 오류:", error);
        setIsLoading(false);
      }
    };
    
    fetchKioskNFTs();
  }, [client, kioskData]);
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">Kiosk NFT 목록</Text>
          
          {isLoadingKiosk || isLoading ? (
            <Text>Kiosk 정보 로딩 중...</Text>
          ) : !kioskData ? (
            <Flex direction="column" gap="3" align="center" style={{ padding: '20px' }}>
              <Text>Kiosk가 설정되지 않았습니다. 먼저 Kiosk를 설정해주세요.</Text>
              <Button onClick={() => window.location.href = '/kiosk-setup'}>Kiosk 설정하기</Button>
            </Flex>
          ) : kioskNFTs.length > 0 ? (
            <Grid columns="3" gap="3">
              {kioskNFTs.map((nft) => (
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
                  </Flex>
                </Card>
              ))}
            </Grid>
          ) : (
            <Text>Kiosk에 NFT가 없습니다. NFT 목록에서 Kiosk에 NFT를 추가해보세요.</Text>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 