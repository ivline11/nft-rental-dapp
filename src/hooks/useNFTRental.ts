import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID, MODULE_NAME, NFT_TYPE, CLOCK_ID } from '../constants';

export function useNFTRental() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // 사용자의 NFT 조회
  const { data: userNFTs, isLoading: isLoadingUserNFTs } = useQuery({
    queryKey: ['userNFTs', account?.address],
    queryFn: async () => {
      if (!account) return [];
      
      try {
        // NFT 객체 조회
        const nftObjects = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: NFT_TYPE },
          options: { showContent: true, showDisplay: true },
        });
        
        // NFT 객체 데이터 가공
        const processedNFTs = nftObjects.data.map(obj => {
          const content = obj.data?.content;
          
          let nftName = "Unknown NFT";
          let nftDescription = "";
          
          // content에서 정보 추출
          if (content && typeof content === 'object' && 'fields' in content) {
            const fields = content.fields as any; // 타입 단언으로 오류 방지
            
            // 타입 안전하게 필드 접근
            if (fields) {
              // fields가 객체인 경우
              if (typeof fields === 'object') {
                // fields가 배열인 경우 (MoveValue[])
                if (Array.isArray(fields)) {
                  // 배열에서 필드 찾기
                  for (const field of fields) {
                    if (field && typeof field === 'object' && 'key' in field && 'value' in field) {
                      if (field.key === 'name') nftName = String(field.value);
                      if (field.key === 'description') nftDescription = String(field.value);
                    }
                  }
                } 
                // fields가 객체인 경우
                else {
                  // 직접 속성 접근
                  if ('name' in fields) nftName = String(fields.name);
                  if ('description' in fields) nftDescription = String(fields.description);
                }
              }
            }
          }
          
          const nft = {
            id: obj.data?.objectId,
            type: obj.data?.type,
            name: nftName,
            description: nftDescription,
          };
          
          return nft;
        });
        
        return processedNFTs;
      } catch (error) {
        console.error("Error fetching user NFTs:", error);
        return [];
      }
    },
    enabled: !!account,
  });
  
  // 대여 가능한 NFT 조회
  const { data: rentableNFTs, isLoading: isLoadingRentableNFTs } = useQuery({
    queryKey: ['rentableNFTs'],
    queryFn: async () => {
      // 여기서는 간단하게 구현합니다. 실제로는 더 복잡한 쿼리가 필요할 수 있습니다.
      const objects = await client.getOwnedObjects({
        owner: "0x0", // 공유 객체
        filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::Rentable<${NFT_TYPE}>` },
        options: { showContent: true },
      });
      
      return objects.data.map(obj => ({
        id: obj.data?.objectId,
        type: obj.data?.type,
        content: obj.data?.content,
      }));
    },
  });
  
  // NFT 생성
  const createNFT = useMutation({
    mutationFn: async ({ name, description }: {
      name: string;
      description: string;
    }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      console.log("Creating NFT with:", { name, description });
      
      const tx = new Transaction();
      
      try {
        // NFT 생성 함수 호출 (빈 URL 전달)
        tx.moveCall({
          target: `${PACKAGE_ID}::simple_nft::create_nft`,
          arguments: [
            tx.pure.string(name),
            tx.pure.string(description),
            tx.pure.string(""), // 빈 URL 전달
          ],
        });
        
        // 가스 예산 설정
        tx.setGasBudget(10000000);
        
        const result = await signAndExecuteTransaction({
          transaction: tx,
        });
        console.log("Transaction result:", result);
        return result;
      } catch (error) {
        console.error("Transaction error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNFTs', account?.address] });
      alert("NFT가 성공적으로 생성되었습니다!");
    },
    onError: (error) => {
      console.error("NFT 생성 실패:", error);
      
      let errorMessage = "알 수 없는 오류";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes("User rejected")) {
          errorMessage = "트랜잭션이 거부되었습니다. 지갑에서 트랜잭션을 승인해주세요.";
        }
      }
      
      alert(`NFT 생성 실패: ${errorMessage}`);
    }
  });
  
  // RentalPolicy 및 ProtectedTP 설정
  const setupRenting = useMutation({
    mutationFn: async ({ publisherId, royaltyBasisPoints }: { publisherId: string, royaltyBasisPoints: number }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      const tx = new Transaction();
      
      // RentalPolicy 및 ProtectedTP 설정 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::setup_renting`,
        arguments: [
          tx.object(publisherId),
          tx.pure.u64(royaltyBasisPoints),
        ],
        typeArguments: [NFT_TYPE],
      });
      
      return signAndExecuteTransaction({
        transaction: tx,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentalPolicy'] });
    },
  });
  
  // NFT 대여 등록하기
  const listNFTForRent = useMutation({
    mutationFn: async ({ 
      kioskId,
      kioskCapId,
      protectedTpId,
      nftId, 
      duration, 
      pricePerDay 
    }: { 
      kioskId: string,
      kioskCapId: string,
      protectedTpId: string,
      nftId: string, 
      duration: number, 
      pricePerDay: number 
    }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      const tx = new Transaction();
      
      // 대여 등록 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::list`,
        arguments: [
          tx.object(kioskId),
          tx.object(kioskCapId),
          tx.object(protectedTpId),
          tx.pure.id(nftId),
          tx.pure.u64(duration),
          tx.pure.u64(pricePerDay),
        ],
        typeArguments: [NFT_TYPE],
      });
      
      return signAndExecuteTransaction({
        transaction: tx,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNFTs', 'rentableNFTs'] });
    },
  });
  
  // NFT 대여하기
  const rentNFT = useMutation({
    mutationFn: async ({ 
      renterKioskId,
      borrowerKioskId,
      rentalPolicyId,
      nftId, 
      totalPrice 
    }: { 
      renterKioskId: string,
      borrowerKioskId: string,
      rentalPolicyId: string,
      nftId: string, 
      totalPrice: number 
    }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      const tx = new Transaction();
      
      // SUI 코인 분할
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPrice)]);
      
      // 대여 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::rent`,
        arguments: [
          tx.object(renterKioskId),
          tx.object(borrowerKioskId),
          tx.object(rentalPolicyId),
          tx.pure.id(nftId),
          coin,
          tx.object(CLOCK_ID),
        ],
        typeArguments: [NFT_TYPE],
      });
      
      return signAndExecuteTransaction({
        transaction: tx,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNFTs', 'rentableNFTs', 'rentedNFTs'] });
    },
  });
  
  // 대여한 NFT 반환하기
  const returnNFT = useMutation({
    mutationFn: async ({ 
      borrowerKioskId,
      borrowerKioskCapId,
      nftId 
    }: { 
      borrowerKioskId: string,
      borrowerKioskCapId: string,
      nftId: string 
    }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      const tx = new Transaction();
      
      // NFT와 Promise 가져오기
      const [nft, promise] = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::borrow_val`,
        arguments: [
          tx.object(borrowerKioskId),
          tx.object(borrowerKioskCapId),
          tx.pure.id(nftId),
        ],
        typeArguments: [NFT_TYPE],
      });
      
      // NFT 반환하기
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::return_val`,
        arguments: [
          tx.object(borrowerKioskId),
          nft,
          promise,
        ],
        typeArguments: [NFT_TYPE],
      });
      
      return signAndExecuteTransaction({
        transaction: tx,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentedNFTs'] });
    },
  });
  
  // NFT를 Kiosk에 추가
  const addNFTToKiosk = useMutation({
    mutationFn: async ({ nftId, kioskId, kioskCapId }: {
      nftId: string;
      kioskId: string;
      kioskCapId: string;
    }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      console.log("Adding NFT to Kiosk:", { nftId, kioskId, kioskCapId });
      
      const tx = new Transaction();
      
      try {
        // NFT를 Kiosk에 추가하는 함수 호출
        tx.moveCall({
          target: `0x2::kiosk::place`,
          arguments: [
            tx.object(kioskId),
            tx.object(kioskCapId),
            tx.object(nftId),
          ],
          typeArguments: [NFT_TYPE], // NFT 타입 지정
        });
        
        // 가스 예산 설정
        tx.setGasBudget(10000000);
        
        const result = await signAndExecuteTransaction({
          transaction: tx,
        });
        console.log("Transaction result:", result);
        return result;
      } catch (error) {
        console.error("Transaction error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("NFT added to Kiosk successfully:", data);
      queryClient.invalidateQueries({ queryKey: ['userNFTs', account?.address] });
      queryClient.invalidateQueries({ queryKey: ['kioskNFTs', account?.address] });
      alert("NFT가 성공적으로 Kiosk에 추가되었습니다!");
    },
    onError: (error) => {
      console.error("NFT Kiosk 추가 실패:", error);
      
      let errorMessage = "알 수 없는 오류";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes("User rejected")) {
          errorMessage = "트랜잭션이 거부되었습니다. 지갑에서 트랜잭션을 승인해주세요.";
        }
      }
      
      alert(`NFT Kiosk 추가 실패: ${errorMessage}`);
    }
  });
  
  return {
    userNFTs,
    isLoadingUserNFTs,
    rentableNFTs,
    isLoadingRentableNFTs,
    createNFT,
    setupRenting,
    listNFTForRent,
    rentNFT,
    returnNFT,
    addNFTToKiosk,
  };
}