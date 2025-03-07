import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID, MODULE_NAME, NFT_TYPE } from '../constants';
import { NFTData } from '../types/nftData';

// 커스텀 반환 타입 정의
type InstallResult = { status: string } | null;

export function useKiosk() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // 사용자의 Kiosk 정보 조회
  const { data: kioskData, isLoading: isLoadingKiosk, refetch: refetchKioskData } = useQuery({
    queryKey: ['userKiosk', account?.address],
    queryFn: async () => {
      if (!account) return null;
      
      try {
        // Kiosk 객체 조회
        const kioskObjects = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: "0x2::kiosk::Kiosk" },
          options: { showContent: true },
        });
        
        // KioskOwnerCap 객체 조회
        const kioskCapObjects = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: "0x2::kiosk::KioskOwnerCap" },
          options: { showContent: true },
        });
        
        // ProtectedTP 객체 조회
        const protectedTpObjects = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::ProtectedTP` },
          options: { showContent: true },
        });
        
        if (kioskObjects.data.length === 0 || kioskCapObjects.data.length === 0) {
          return null;
        }
        
        const kioskId = kioskObjects.data[0].data?.objectId;
        const kioskCapId = kioskCapObjects.data[0].data?.objectId;
        const protectedTpId = protectedTpObjects.data.length > 0 ? protectedTpObjects.data[0].data?.objectId : null;
        
        if (!kioskId || !kioskCapId) {
          return null;
        }
        
        // Rentables 확장이 설치되어 있는지 확인
        let hasRentablesExt = false;
        try {
          // Kiosk 객체의 상세 정보 조회
          const kioskObj = await client.getObject({
            id: kioskId,
            options: { showContent: true, showDisplay: true, showType: true }
          });
          
          console.log("Kiosk object:", kioskObj);
          
          // 확장 확인 로직
          // 1. 다이나믹 필드 조회
          const dynamicFields = await client.getDynamicFields({
            parentId: kioskId
          });
          
          console.log("Dynamic fields:", dynamicFields);
          
          // 2. Rentables 확장 찾기
          for (const field of dynamicFields.data) {
            if (field.name && typeof field.name === 'object') {
              // 필드 이름이나 타입에 'rentables'가 포함되어 있는지 확인
              const nameStr = JSON.stringify(field.name).toLowerCase();
              if (nameStr.includes('rentables') || nameStr.includes('rent')) {
                console.log("Found Rentables extension:", field);
                hasRentablesExt = true;
                break;
              }
            }
          }
          
          // 3. 또는 특정 타입의 객체가 있는지 확인
          const rentableObjects = await client.getOwnedObjects({
            owner: account.address,
            filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::Rentables` },
          });
          
          if (rentableObjects.data.length > 0) {
            console.log("Found Rentables extension objects:", rentableObjects);
            hasRentablesExt = true;
          }
          
        } catch (error) {
          console.error("Error checking rentables extension:", error);
        }
        
        return {
          kioskId,
          kioskCapId,
          protectedTpId,
          hasRentablesExt
        };
      } catch (error) {
        console.error("Error fetching kiosk data:", error);
        return null;
      }
    },
    enabled: !!account,
  });
  
  // Kiosk 생성
  const createKiosk = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      const tx = new Transaction();
      
      // Kiosk 생성 함수 호출 - 반환값을 변수에 저장
      const [kiosk, kioskCap] = tx.moveCall({
        target: "0x2::kiosk::new",
        arguments: [],
      });
      
      // 생성된 Kiosk와 KioskCap을 사용자 지갑으로 전송
      tx.transferObjects(
        [kiosk],
        tx.pure.address(account.address)
      );
      
      tx.transferObjects(
        [kioskCap],
        tx.pure.address(account.address)
      );
      
      // 트랜잭션에 직접 가스 예산 설정
      tx.setGasBudget(10000000);
      
      return signAndExecuteTransaction({
        transaction: tx,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userKiosk', account?.address] });
    },
  });
  
  // Rentables 확장 설치
  const installRentables = useMutation({
    mutationFn: async (isReinstall: boolean = false): Promise<InstallResult | any> => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      if (!kioskData) throw new Error("Kiosk가 생성되지 않았습니다");
      
      // 재설치가 아닐 때만 체크
      if (!isReinstall && kioskData.hasRentablesExt) {
        console.log("Rentables 확장이 이미 설치되어 있습니다.");
        return { status: "already_installed" };
      }
      
      const tx = new Transaction();
      
      // Rentables 확장 설치 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::install`,
        arguments: [
          tx.object(kioskData.kioskId),
          tx.object(kioskData.kioskCapId),
        ],
      });
      
      tx.setGasBudget(10000000);
      
      return signAndExecuteTransaction({
        transaction: tx,
      });
    },
    onSuccess: async (data) => {
      if (data && typeof data === 'object' && 'status' in data && data.status === "already_installed") {
        alert("Rentables 확장이 이미 설치되어 있습니다.");
      } else {
        alert("Rentables 확장이 성공적으로 설치되었습니다!");
      }
      await refetchKioskData();
      queryClient.invalidateQueries({ queryKey: ['userKiosk', account?.address] });
    },
  });
  
  // ProtectedTP 및 RentalPolicy 설정
  const setupRenting = useMutation({
    mutationFn: async ({ nftType, amountBp }: { nftType: string, amountBp: number }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      if (!kioskData) throw new Error("Kiosk가 생성되지 않았습니다");
      
      // 이미 ProtectedTP가 있는지 확인
      if (kioskData.protectedTpId) {
        console.log("ProtectedTP가 이미 설정되어 있습니다.");
        return { status: "already_setup", protectedTpId: kioskData.protectedTpId };
      }
      
      const tx = new Transaction();
      
      // Publisher 객체 조회 (실제 구현에서는 Publisher 객체 ID를 제공해야 함)
      // 이 부분은 실제 환경에 맞게 수정해야 합니다
      const publisherId = "0x..."; // Publisher 객체 ID
      
      // setup_renting 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::setup_renting`,
        typeArguments: [nftType], // NFT 타입 (예: "0x2::devnet_nft::DevNetNFT")
        arguments: [
          tx.object(publisherId), // Publisher 객체
          tx.pure.u64(amountBp),  // 로열티 금액 (basis points)
        ],
      });
      
      // 트랜잭션에 직접 가스 예산 설정
      tx.setGasBudget(10000000);
      
      return signAndExecuteTransaction({
        transaction: tx,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userKiosk', account?.address] });
    },
  });

  // kiosk rental extension remove
  const removeKiosk = useMutation({
    mutationFn: async () => {
      if (!kioskData) throw new Error("Kiosk가 생성되지 않았습니다");
      if (!account?.address) throw new Error("지갑이 연결되지 않았습니다");

      try {
        // extension storage 확인
        const fields = await client.getDynamicFields({
          parentId: kioskData.kioskId,
        });
        
        console.log("Extension fields:", fields);
        
        if (fields.data.length > 0) {
          throw new Error(`Extension storage가 비어있지 않습니다. 
먼저 모든 NFT를 회수하거나 제거해주세요.
현재 storage 항목 수: ${fields.data.length}`);
        }

        const tx = new Transaction();
        
        // extension 제거
        tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::remove`,
          arguments: [
            tx.object(kioskData.kioskId),
            tx.object(kioskData.kioskCapId),
          ],
          typeArguments: [],
        });
        
        tx.setGasBudget(2000000);

        const result = await signAndExecuteTransaction({
          transaction: tx,
        });

        console.log("Extension 제거 결과:", result);
        return result;
      } catch (error) {
        console.error("Extension 제거 실패:", error);
        console.error("Error details:", {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        });
        throw error;
      }
    }
  });

  // kiosk NFT 조회
  const getKioskNFTs = useQuery({
    queryKey: ['kioskNFTs', account?.address, kioskData?.kioskId],
    queryFn: async (): Promise<NFTData[] | null> => {
      if (!account || !kioskData?.kioskId) return null;
      
      try {
        // 키오스크 객체의 다이나믹 필드 조회
        const dynamicFields = await client.getDynamicFields({
          parentId: kioskData.kioskId
        });
        
        console.log("Kiosk dynamic fields:", dynamicFields);
        
        const nfts: NFTData[] = [];
        
        // 각 다이나믹 필드에 대해 처리
        for (const field of dynamicFields.data) {
          try {
            // 필드 객체 조회
            const fieldObj = await client.getDynamicFieldObject({
              parentId: kioskData.kioskId,
              name: field.name
            });
            
            console.log("Field object:", fieldObj);
            
            // 필드가 객체 ID를 가지고 있는지 확인
            if (fieldObj.data && fieldObj.data.content) {
              const content = fieldObj.data.content as any;
              
              // NFT 타입 체크
              if (content.type && content.type.includes('simple_nft::NFT')) {
                console.log("Found NFT:", content);
                
                // content.fields에서 직접 데이터 추출
                const nftData: NFTData = {
                  id: content.fields.id.id || fieldObj.data.objectId,
                  name: content.fields.name || '이름 없음',
                  description: content.fields.description || '',
                  type: content.type
                };
                
                // url 필드가 NFTData에 추가되었다면 포함
                if ('url' in content.fields) {
                  (nftData as any).url = content.fields.url;
                }
                
                nfts.push(nftData);
                console.log("Added NFT:", nftData);
              }
            }
          } catch (error) {
            console.error(`Error processing field ${field.name}:`, error);
          }
        }
        
        console.log("Final NFTs list:", nfts);
        return nfts;
      } catch (error) {
        console.error("Error fetching kiosk NFTs:", error);
        return null;
      }
    },
    enabled: !!account && !!kioskData?.kioskId,
  });

  const removeNFT = useMutation({
    mutationFn: async (nftId: string) => {
      if (!kioskData?.kioskId || !kioskData?.kioskCapId || !account?.address) {
        throw new Error('Kiosk 정보가 없습니다.');
      }

      const tx = new Transaction();
      
      // NFT를 키오스크에서 제거하고 반환값을 변수에 저장
      const [nft] = tx.moveCall({
        target: '0x2::kiosk::take',
        arguments: [
          tx.object(kioskData.kioskId),    // kiosk
          tx.object(kioskData.kioskCapId), // cap
          tx.pure.id(nftId),               // id
        ],
        typeArguments: [NFT_TYPE],
      });

      // 제거한 NFT를 사용자의 지갑으로 전송
      tx.transferObjects(
        [nft],
        tx.pure.address(account.address)
      );
      
      tx.setGasBudget(10000000);

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      // NFT 목록 갱신
      await getKioskNFTs.refetch();
      
      return result;
    }
  });

  
  return {
    kioskData,
    isLoadingKiosk,
    createKiosk,
    installRentables,
    setupRenting,
    refetchKioskData,
    removeKiosk,
    getKioskNFTs,
    removeNFT
  };
}