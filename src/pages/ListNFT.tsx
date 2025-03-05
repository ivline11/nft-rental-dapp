import { useState, useEffect } from 'react';
import { Theme, Card, Text, Flex, Button, Select, TextField, Grid } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';
import { useKiosk } from '../hooks/useKiosk';
import { useSuiClient } from '@mysten/dapp-kit';

// NFT 타입 정의
interface KioskNFTData {
  id: string;
  name: string;
  description: string;
}

export function ListNFT() {
  const { listNFTForRent } = useNFTRental();
  const { kioskData } = useKiosk();
  const client = useSuiClient();
  
  const [kioskNFTs, setKioskNFTs] = useState<KioskNFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [duration, setDuration] = useState<string>('1');
  const [pricePerDay, setPricePerDay] = useState<string>('1000');
  const [protectedTpId, setProtectedTpId] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Kiosk NFT 목록 가져오기
  useEffect(() => {
    const fetchKioskNFTs = async () => {
      if (!kioskData || !kioskData.kioskId) {
        setIsLoading(false);
        setDebugInfo('Kiosk 데이터가 없습니다.');
        return;
      }
      
      try {
        setIsLoading(true);
        setDebugInfo('Kiosk 데이터 로딩 중...');
        
        // Kiosk 정보 로깅
        console.log("Kiosk 데이터:", kioskData);
        
        // Kiosk의 다이나믹 필드 조회
        const dynamicFields = await client.getDynamicFields({
          parentId: kioskData.kioskId
        });
        
        console.log("Kiosk 다이나믹 필드:", dynamicFields.data);
        setDebugInfo(`다이나믹 필드 ${dynamicFields.data.length}개 발견`);
        
        // NFT 객체 정보 가져오기
        const nfts: KioskNFTData[] = [];
        
        // Protected Transfer Policy ID 찾기
        let tpId = '';
        for (const field of dynamicFields.data) {
          if (field.name.type?.includes('::transfer_policy::') || 
              field.name.type?.includes('TransferPolicy') || 
              field.name.type?.includes('transfer_policy')) {
            
            console.log("Transfer Policy 필드 발견:", field);
            
            const fieldObj = await client.getDynamicFieldObject({
              parentId: kioskData.kioskId,
              name: field.name
            });
            
            console.log("Transfer Policy 객체:", fieldObj.data);
            
            tpId = fieldObj.data?.objectId || '';
            if (tpId) {
              setProtectedTpId(tpId);
              console.log("Found Protected Transfer Policy ID:", tpId);
              setDebugInfo(prev => prev + `\nTransfer Policy ID 발견: ${tpId.substring(0, 8)}...`);
              break;
            }
          }
        }
        
        // 모든 다이나믹 필드 로깅 (디버깅용)
        console.log("모든 다이나믹 필드:", dynamicFields.data);
        setDebugInfo(prev => prev + `\n다이나믹 필드 타입 목록:`);
        for (const field of dynamicFields.data) {
          const fieldType = field.name.type || "타입 없음";
          console.log("필드 타입:", fieldType);
          setDebugInfo(prev => prev + `\n- ${fieldType}`);
        }
        
        // Transfer Policy를 찾지 못한 경우 수동으로 입력할 수 있는 UI 추가
        if (!tpId) {
          setDebugInfo(prev => prev + `\nTransfer Policy ID를 찾지 못했습니다. 수동으로 입력해주세요.`);
        }
        
        // NFT 객체 정보 조회
        let nftCount = dynamicFields.data.length;
        for (const field of dynamicFields.data) {
          try {
            // 필드 값 조회
            const fieldObj = await client.getDynamicFieldObject({
              parentId: kioskData.kioskId,
              name: field.name
            });
            
            console.log("다이나믹 필드 객체:", fieldObj.data);
            
            // 필드 타입 확인
            const content = fieldObj.data?.content;
            let typeStr = "";
            let isNFT = false;
            
            if (content && typeof content === 'object') {
              // moveObject인 경우 type 속성 접근
              if ('dataType' in content && content.dataType === 'moveObject' && 'type' in content) {
                typeStr = content.type as string;
                console.log("필드 타입:", typeStr);
                
                // NFT 타입 확인 (더 넓은 범위로 확인)
                isNFT = typeStr.includes('::nft::') || 
                        typeStr.includes('Nft') || 
                        typeStr.includes('NFT') ||
                        (content.fields && typeof content.fields === 'object' && 
                         ('name' in content.fields || 'description' in content.fields));
              }
            }
            
            // NFT 타입이거나 의심되는 경우
            if (isNFT || (fieldObj.data?.objectId && !typeStr.includes('::transfer_policy::'))) {
              nftCount++;
              // NFT 객체 ID 추출
              const nftId = fieldObj.data?.objectId;
              if (!nftId) continue;
              
              console.log("NFT ID 발견:", nftId);
              setDebugInfo(prev => prev + `\nNFT ID 발견: ${nftId.substring(0, 8)}...`);
              
              // NFT 객체 정보 조회
              const nftObj = await client.getObject({
                id: nftId,
                options: { showContent: true }
              });
              
              console.log("NFT 객체:", nftObj.data);
              
              // NFT 데이터 추출
              const nftContent = nftObj.data?.content;
              const nftData: KioskNFTData = {
                id: nftId,
                name: "Unknown NFT",
                description: "",
              };
              
              // content에서 정보 추출
              if (nftContent && typeof nftContent === 'object') {
                if ('fields' in nftContent) {
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
                } else if ('name' in nftContent) {
                  // 직접 name 속성이 있는 경우
                  nftData.name = String(nftContent.name);
                  if ('description' in nftContent) {
                    nftData.description = String(nftContent.description);
                  }
                }
              }
              
              nfts.push(nftData);
              console.log("NFT 데이터 추가:", nftData);
            }
          } catch (error) {
            console.error("필드 처리 중 오류:", error);
          }
        }
        
        setKioskNFTs(nfts);
        setDebugInfo(prev => prev + `\n총 ${nfts.length}개의 NFT를 찾았습니다.`);
        
        if (nfts.length > 0) {
          setSelectedNFT(nfts[0].id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Kiosk NFT 조회 오류:", error);
        setIsLoading(false);
        setDebugInfo(`오류 발생: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    fetchKioskNFTs();
  }, [client, kioskData]);
  
  const handleListForRent = async () => {
    if (!selectedNFT || !kioskData) {
      alert("NFT와 Kiosk 정보가 필요합니다.");
      return;
    }
    
    const durationNum = parseInt(duration);
    const priceNum = parseInt(pricePerDay);
    
    if (isNaN(durationNum) || isNaN(priceNum)) {
      alert("유효한 기간과 가격을 입력하세요.");
      return;
    }
    
    if (!protectedTpId) {
      alert("Protected Transfer Policy ID를 찾을 수 없습니다. Kiosk 설정을 확인해주세요.");
      return;
    }
    
    // 디버깅 정보 추가
    console.log("NFT 대여 등록 시작");
    console.log("NFT ID:", selectedNFT);
    console.log("Kiosk ID:", kioskData.kioskId);
    console.log("Kiosk Cap ID:", kioskData.kioskCapId);
    console.log("대여 기간:", durationNum);
    console.log("일일 가격:", priceNum);
    console.log("Protected TP ID:", protectedTpId);
    
    setDebugInfo(prev => prev + `\n\nNFT 대여 등록 시작:
- NFT ID: ${selectedNFT.substring(0, 8)}...
- Kiosk ID: ${kioskData.kioskId.substring(0, 8)}...
- Kiosk Cap ID: ${kioskData.kioskCapId.substring(0, 8)}...
- 대여 기간: ${durationNum}일
- 일일 가격: ${priceNum} SUI
- Protected TP ID: ${protectedTpId.substring(0, 8)}...`);
    
    try {
      // mutateAsync를 사용하여 Promise 반환 받기
      const result = await listNFTForRent.mutateAsync({
        nftId: selectedNFT,
        kioskId: kioskData.kioskId,
        kioskCapId: kioskData.kioskCapId,
        duration: durationNum,
        pricePerDay: priceNum,
        protectedTpId: protectedTpId,
      });
      
      console.log("NFT 대여 등록 결과:", result);
      setDebugInfo(prev => prev + `\n\nNFT 대여 등록 성공!
결과: ${JSON.stringify(result, null, 2)}`);
      
      alert("NFT 대여 등록이 완료되었습니다!");
    } catch (error) {
      console.error("NFT 대여 등록 오류:", error);
      setDebugInfo(prev => prev + `\n\nNFT 대여 등록 오류:
${error instanceof Error ? error.message : String(error)}`);
      
      alert(`NFT 대여 등록 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">NFT 대여 등록</Text>
          
          {isLoading ? (
            <Text>Kiosk NFT 정보 로딩 중...</Text>
          ) : !kioskData ? (
            <Flex direction="column" gap="3" align="center" style={{ padding: '20px' }}>
              <Text>Kiosk가 설정되지 않았습니다. 먼저 Kiosk를 설정해주세요.</Text>
              <Button onClick={() => document.querySelector('[value="kiosk"]')?.dispatchEvent(new MouseEvent('click'))}>
                Kiosk 설정하기
              </Button>
            </Flex>
          ) : kioskNFTs.length === 0 ? (
            <Flex direction="column" gap="3" align="center" style={{ padding: '20px' }}>
              <Text>Kiosk에 NFT가 없습니다. 먼저 NFT를 Kiosk에 추가해주세요.</Text>
              <Button onClick={() => document.querySelector('[value="nftlist"]')?.dispatchEvent(new MouseEvent('click'))}>
                NFT 목록으로 이동
              </Button>
              
              {/* 디버그 정보 표시 */}
              <Card style={{ marginTop: '20px', backgroundColor: '#f9f9f9', width: '100%' }}>
                <Text size="2" weight="bold">디버그 정보:</Text>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{debugInfo}</pre>
              </Card>
            </Flex>
          ) : (
            <>
              <Text size="3" weight="bold">대여할 NFT 선택</Text>
              
              <Grid columns="3" gap="3">
                {kioskNFTs.map((nft) => (
                  <Card 
                    key={nft.id}
                    style={{ 
                      cursor: 'pointer',
                      border: selectedNFT === nft.id ? '2px solid blue' : '1px solid #ccc'
                    }}
                    onClick={() => setSelectedNFT(nft.id)}
                  >
                    <Flex direction="column" gap="2">
                      {/* 이미지 대신 NFT 정보 카드 표시 */}
                      <div style={{ 
                        width: '100%', 
                        height: '120px', 
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Text size="3" weight="bold" style={{ marginBottom: '8px' }}>
                          {nft.name || "이름 없음"}
                        </Text>
                        <Text size="2" style={{ color: '#666', flex: 1, overflow: 'hidden' }}>
                          {nft.description || "설명 없음"}
                        </Text>
                        <Text size="1" style={{ color: '#999', marginTop: '8px' }}>
                          ID: {nft.id.substring(0, 10)}...
                        </Text>
                      </div>
                    </Flex>
                  </Card>
                ))}
              </Grid>
              
              <Flex direction="column" gap="2">
                <Text size="3" weight="bold">대여 기간 설정 (일)</Text>
                <Select.Root value={duration} onValueChange={setDuration}>
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="1">1일</Select.Item>
                    <Select.Item value="3">3일</Select.Item>
                    <Select.Item value="7">7일</Select.Item>
                    <Select.Item value="30">30일</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
              
              <Flex direction="column" gap="2">
                <Text size="3" weight="bold">일일 대여 가격 설정 (SUI)</Text>
                <TextField.Root
                  type="number"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(e.target.value)}
                  placeholder="일일 대여 가격을 입력하세요"
                />
              </Flex>
              
              {!protectedTpId && (
                <Flex direction="column" gap="2">
                  <Text size="3" weight="bold">Protected Transfer Policy ID 수동 입력</Text>
                  <Text size="2">Transfer Policy ID를 찾지 못했습니다. 수동으로 입력해주세요.</Text>
                  <TextField.Root
                    value={protectedTpId}
                    onChange={(e) => setProtectedTpId(e.target.value)}
                    placeholder="Protected Transfer Policy ID 입력"
                  />
                </Flex>
              )}
              
              {protectedTpId ? (
                <Button 
                  onClick={handleListForRent}
                  disabled={listNFTForRent.isPending || !selectedNFT}
                  color="blue"
                >
                  {listNFTForRent.isPending ? '처리 중...' : 'NFT 대여 등록하기'}
                </Button>
              ) : (
                <Flex direction="column" gap="2" align="center">
                  <Text color="red">Protected Transfer Policy ID를 찾을 수 없습니다.</Text>
                  <Button 
                    onClick={() => document.querySelector('[value="kiosk"]')?.dispatchEvent(new MouseEvent('click'))}
                    color="red"
                  >
                    Kiosk 설정 확인하기
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 