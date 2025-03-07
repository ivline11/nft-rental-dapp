import { useState, useEffect } from 'react';
import { Theme, Card, Text, Flex, Button, Select, TextField } from '@radix-ui/themes';
import { useKiosk } from '../hooks/useKiosk';
import { useSuiClient } from '@mysten/dapp-kit';
import { NFTData } from '../types/nftData';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { NFT_TYPE, PROTECTED_TP_ID, MODULE_NAME, PACKAGE_ID } from '../constants';

export function ListNFT() {
  const { kioskData, installRentables } = useKiosk();
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [kioskNFTs, setKioskNFTs] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [duration, setDuration] = useState<string>('1');
  const [pricePerDay, setPricePerDay] = useState<string>('1000');
  const [debugInfo, setDebugInfo] = useState<string>('');


  // NFT 대여 목록에 올리는 함수
  const handleListForRent = async () => {
    if (!PROTECTED_TP_ID) {
      alert("Protected Transfer Policy가 설정되지 않았습니다.");
      return;
    }

    // Protected TP 존재 여부 확인
    try {
      const tpObj = await client.getObject({
        id: PROTECTED_TP_ID,
        options: { showContent: true }
      });
      console.log("Protected TP 객체:", tpObj);
      
      if (!tpObj.data) {
        alert("Protected Transfer Policy를 찾을 수 없습니다.");
        return;
      }
    } catch (error) {
      console.error("Protected TP 확인 실패:", error);
      alert("Protected Transfer Policy 확인에 실패했습니다.");
      return;
    }

    // Rentables 확장 설치 확인
    if (!kioskData?.hasRentablesExt) {
      alert("Kiosk에 Rentables 확장이 설치되어 있지 않습니다. 먼저 설치해주세요.");
      return;
    }

    // NFT가 Kiosk에 있는지 확인
    try {
      const kioskObj = await client.getObject({
        id: kioskData.kioskId,
        options: { showContent: true }
      });
      console.log("Kiosk 객체:", kioskObj);
      
      // Kiosk 내용 확인을 위한 디버그 정보
      setDebugInfo(prev => prev + `\n\nKiosk 객체 상태:
      ${JSON.stringify(kioskObj.data, null, 2)}`);

      // 여기에 NFT 존재 여부 확인 로직 추가
    } catch (error) {
      console.error("Kiosk 확인 실패:", error);
      alert("Kiosk 상태 확인에 실패했습니다.");
      return;
    }

    if (!selectedNFT || !kioskData) {
      alert("NFT, Kiosk 정보 및 Protected Transfer Policy가 필요합니다.");
      return;
    }
    
    const durationNum = parseInt(duration);
    // 소수점 처리를 위해 parseFloat 사용
    const priceNum = parseFloat(pricePerDay);
    
    if (isNaN(durationNum) || isNaN(priceNum)) {
      alert("유효한 기간과 가격을 입력하세요.");
      return;
    }

    if (durationNum <= 0) {
      alert("대여 기간은 1일 이상이어야 합니다.");
      return;
    }

    if (priceNum <= 0) {
      alert("대여 가격은 0 SUI보다 커야 합니다.");
      return;
    }
    
    // SUI를 MIST로 변환 (1 SUI = 1,000,000,000 MIST)
    const priceInMist = Math.floor(priceNum * 1000000000);
    
    // 디버깅 정보 추가
    console.log("NFT 대여 등록 시작");
    console.log("NFT ID:", selectedNFT);
    console.log("Kiosk ID:", kioskData.kioskId);
    console.log("Kiosk Cap ID:", kioskData.kioskCapId);
    console.log("Protected TP ID:", PROTECTED_TP_ID);
    console.log("대여 기간:", durationNum);
    console.log("일일 대여 가격:", priceNum, "SUI (", priceInMist, "MIST)");
    
    setDebugInfo(prev => prev + `\n\nNFT 대여 등록 시작:
- NFT ID: ${selectedNFT.substring(0, 8)}...
- Kiosk ID: ${kioskData.kioskId.substring(0, 8)}...
- Kiosk Cap ID: ${kioskData.kioskCapId.substring(0, 8)}...
- Protected TP ID: ${PROTECTED_TP_ID.substring(0, 8)}...
- 대여 기간: ${durationNum}일
- 일일 대여 가격: ${priceNum} SUI (${priceInMist} MIST)`);
    
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::list`,
        arguments: [
          tx.object(kioskData.kioskId),
          tx.object(kioskData.kioskCapId),
          tx.object(PROTECTED_TP_ID),
          tx.pure.id(selectedNFT),
          tx.pure.u64(durationNum),
          tx.pure.u64(priceInMist),  // MIST 단위로 변환된 가격 사용
        ],
        typeArguments: [NFT_TYPE],
      });
      
      tx.setGasBudget(10000000);
      
      // 디버그 정보 추가
      console.log("트랜잭션 내용:", tx);
      setDebugInfo(prev => prev + `\n\n트랜잭션 내용: ${JSON.stringify(tx, null, 2)}`);
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log("NFT 대여 등록 결과:", result);
      
      if (result === undefined) {
        console.log("트랜잭션이 실행되었지만 결과가 반환되지 않았습니다.");
        setDebugInfo(prev => prev + `\n\n트랜잭션이 실행되었지만 결과가 반환되지 않았습니다. 트랜잭션 탐색기에서 확인해보세요.`);
        alert("트랜잭션이 제출되었습니다. 결과는 트랜잭션 탐색기에서 확인하세요.");
        return;
      }
      
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
        const nfts: NFTData[] = [];
        
        // ProtectedTP 정보 로깅
        if (PROTECTED_TP_ID) {
          console.log("ProtectedTP 정보:", PROTECTED_TP_ID);
          setDebugInfo(prev => prev + `\nProtectedTP ID 발견: ${PROTECTED_TP_ID.substring(0, 8)}...`);
        } else {
          console.log("ProtectedTP 정보 없음");
          setDebugInfo(prev => prev + `\nProtectedTP 정보를 찾을 수 없습니다.`);
        }
        
        // 모든 다이나믹 필드 로깅 (디버깅용)
        console.log("모든 다이나믹 필드:", dynamicFields.data);
        setDebugInfo(prev => prev + `\n다이나믹 필드 타입 목록:`);
        for (const field of dynamicFields.data) {
          const fieldType = field.name.type || "타입 없음";
          console.log("필드 타입:", fieldType);
          setDebugInfo(prev => prev + `\n- ${fieldType}`);
        }
        
        // NFT 객체 정보 조회
        let nftCount = 0;
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
              const nftData: NFTData = {
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
          setSelectedNFT(nfts[0].id || '');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Kiosk NFT 조회 오류:", error);
        setIsLoading(false);
        setDebugInfo(`오류 발생: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    fetchKioskNFTs();
  }, [client, kioskData, PROTECTED_TP_ID]);
  
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">NFT 대여 등록</Text>
          
          {isLoading ? (
            <Text>데이터 로딩 중...</Text>
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
              <Select.Root value={selectedNFT} onValueChange={setSelectedNFT}>
                <Select.Trigger />
                <Select.Content>
                  {kioskNFTs.map((nft) => (
                    <Select.Item key={nft.id} value={nft.id || ''}>
                      {nft.name || `NFT (${nft.id?.substring(0, 8) || '...'})`}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              
              <Flex direction="column" gap="2">
                <Text size="3" weight="bold">대여 기간 설정 (일)</Text>
                <TextField.Root
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="대여 기간을 입력하세요"
                />
              </Flex>
              
              <Flex direction="column" gap="2">
                <Text size="3" weight="bold">일일 대여 가격 (SUI)</Text>
                <TextField.Root
                  type="number"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(e.target.value)}
                  min="0.000000001"  // 최소 1 MIST
                  step="0.1"         // 0.1 SUI 단위로 조절 가능
                  placeholder="예: 0.1"
                />
              </Flex>
              
              {/* NFT 대여 등록 버튼 */}
              <Flex direction="column" gap="2">
                <Button 
                  onClick={handleListForRent}
                  disabled={!selectedNFT}
                  color="blue"
                >
                  NFT 대여 등록하기
                </Button>
              </Flex>
              
            </>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 