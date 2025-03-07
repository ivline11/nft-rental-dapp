import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID, MODULE_NAME, NFT_TYPE, CLOCK_ID, PUBLISHER_ID, PROTECTED_TP_ID } from '../constants';
import { useState } from 'react';
import { useKiosk } from './useKiosk';  // useKiosk 훅 import

export function useNFTRental() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { kioskData } = useKiosk();  // kioskData 가져오기

  const [shouldFetchProtectedTP, setShouldFetchProtectedTP] = useState(false);
  
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
        
        console.log("NFT 조회 결과:", nftObjects); // 디버깅용 로그 추가

        // NFT 객체 데이터 가공
        const processedNFTs = nftObjects.data.map(obj => {
          console.log("Processing NFT object:", obj); // 디버깅용 로그 추가
          
          const content = obj.data?.content;
          console.log("NFT content:", content); // 디버깅용 로그 추가
          
          let nftName = "Unknown NFT";
          let nftDescription = "";
          
          // content가 있고 fields 속성이 있는 경우
          if (content && 'fields' in content) {
            const fields = (content as any).fields;
            
            // name과 description 필드 직접 접근
            nftName = fields.name || "Unknown NFT";
            nftDescription = fields.description || "";
          }
          
          const nft = {
            id: obj.data?.objectId,
            type: obj.data?.type,
            name: nftName,
            description: nftDescription,
          };
          
          console.log("Processed NFT:", nft); // 디버깅용 로그 추가
          return nft;
        });
        
        console.log("Final processed NFTs:", processedNFTs); // 디버깅용 로그 추가
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
    queryKey: ['rentableNFTs', kioskData?.kioskId],
    queryFn: async () => {
      if (!kioskData?.kioskId) {
        console.log("Kiosk가 설정되지 않았습니다.");
        return [];
      }

      try {
        console.log("Fetching rentable NFTs");
        
        // Kiosk의 Dynamic Fields 조회
        const dynamicFields = await client.getDynamicFields({
          parentId: kioskData.kioskId,
        });
        
        console.log("Kiosk dynamic fields:", dynamicFields);
        
        const rentableDetails = await Promise.all(
          dynamicFields.data.map(async (field) => {
            const details = await client.getDynamicFieldObject({
              parentId: kioskData.kioskId,
              name: field.name
            });
            
            console.log("Dynamic field details:", details);
            
            // Listed 타입의 Dynamic Field 찾기
            const content = details.data?.content;
            if (content?.dataType === 'moveObject' && 
                content.type?.includes(`${PACKAGE_ID}::rentables_ext::Listed`)) {
              
              console.log("Found Listed Rentable:", content);
              
              // Rentable 객체의 필드 접근
              const rentableFields = content.fields as {
                nft: { id: string };
                price_per_day: string | number;
                duration: string | number;
              };
              
              return {
                id: details.data?.objectId,
                type: content.type,
                nftId: rentableFields.nft?.id,
                pricePerDay: Number(rentableFields.price_per_day),
                duration: Number(rentableFields.duration),
                content: content
              };
            }
            return null;
          })
        );
        
        console.log("Rentable details:", rentableDetails);
        
        return rentableDetails.filter(Boolean);
        
      } catch (error) {
        console.error("Error fetching rentable NFTs:", error);
        return [];
      }
    },
    enabled: !!kioskData?.kioskId,
    refetchInterval: 5000,
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
        // NFT 생성 함수 호출
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

  // Publisher 객체 생성 함수
// const createPublisher = useMutation({
//   mutationFn: async () => {
//     if (!account) throw new Error("지갑이 연결되지 않았습니다");
    
//     try {
//       console.log("Publisher 객체 생성 시작");
      
//       const publisherTx = new Transaction();
//       publisherTx.moveCall({
//         target: "0x2::package::claim",
//         arguments: [
//           publisherTx.pure.address(PACKAGE_ID),
//           publisherTx.pure.address(OWNER_ID), // 배포자 주소
//         ],
//       });
      
//       publisherTx.setGasBudget(10000000);
      
//       const publisherResult = await signAndExecuteTransaction({
//         transaction: publisherTx,
//       });
      
//       console.log("Publisher 생성 결과:", publisherResult);
      
//       // 전체 결과를 JSON 문자열로 로깅
//       console.log("Publisher 생성 결과 (전체):", JSON.stringify(publisherResult, null, 2));
      
//       // 사용자에게 콘솔에서 결과를 확인하라고 안내
//       alert("Publisher 객체가 생성되었습니다. 콘솔에서 결과를 확인하고 생성된 객체 ID를 찾아주세요.");
      
//       return "콘솔에서 객체 ID를 확인하세요";
//     } catch (error) {
//       console.error("Publisher 생성 오류:", error);
//       throw error;
//     }
//   },
//   onSuccess: (message) => {
//     console.log("Publisher 객체 생성 성공:", message);
//   },
//   onError: (error) => {
//     console.error("Publisher 생성 실패:", error);
//     alert(`Publisher 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
//   }
// });


// 렌탈 정책 설정
const setupRenting = useMutation({
  mutationFn: async ({ royaltyBasisPoints }: { royaltyBasisPoints: number }) => {
    if (!account) throw new Error("지갑이 연결되지 않았습니다");
    
    const tx = new Transaction();
    
    try {
      console.log("Setting up renting with:", { publisherId: PUBLISHER_ID, royaltyBasisPoints });
      
      // setup_renting 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::setup_renting`,
        arguments: [
          tx.object(PUBLISHER_ID),
          tx.pure.u64(royaltyBasisPoints),
        ],
        typeArguments: [NFT_TYPE],
      });
      
      // 가스 예산 설정
      tx.setGasBudget(10000000);
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log("Setup renting transaction result:", result);
      
      // 트랜잭션 실행 후 ProtectedTP 객체 조회
      const protectedTPs = await client.getOwnedObjects({
        owner: PUBLISHER_ID,
        filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::ProtectedTP<${NFT_TYPE}>` },
        options: { showContent: true },
      });
      
      if (protectedTPs.data.length > 0) {
        const protectedTPId = protectedTPs.data[0].data?.objectId;
        if (protectedTPId) {
          return { protectedTPId };
        }
      }
      
      return result;
    } catch (error) {
      console.error("Setup renting transaction error:", error);
      throw error;
    }
  },
  onSuccess: (data) => {
    console.log("Setup renting successful:", data);
    
    // 생성된 ProtectedTP ID가 있으면 쿼리 캐시 직접 업데이트
    if ('protectedTPId' in data) {
      queryClient.setQueryData(['protectedTP'], {
        id: data.protectedTPId,
        type: `${PACKAGE_ID}::${MODULE_NAME}::ProtectedTP<${NFT_TYPE}>`
      });
    } else {
      // 없으면 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['protectedTP'] });
    }
    
    // ProtectedTP 객체 조회 활성화
    setShouldFetchProtectedTP(true);
    
    alert("대여 시스템이 성공적으로 설정되었습니다!");
  },
  onError: (error) => {
    console.error("대여 시스템 설정 실패:", error);
    
    let errorMessage = "알 수 없는 오류";
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes("User rejected")) {
        errorMessage = "트랜잭션이 거부되었습니다. 지갑에서 트랜잭션을 승인해주세요.";
      } else if (errorMessage.includes("insufficient gas")) {
        errorMessage = "가스가 부족합니다. SUI 잔액을 확인해주세요.";
      } else if (errorMessage.includes("authority")) {
        errorMessage = "Publisher 권한이 없습니다. NFT 타입의 게시자만 이 기능을 사용할 수 있습니다.";
      }
    }
    
    alert(`대여 시스템 설정 실패: ${errorMessage}`);
  }
});
  
  // ProtectedTP 객체 조회
const protectedTP = { id: PROTECTED_TP_ID };
const isLoadingProtectedTP = false; // 항상 로딩 완료 상태
  
  // NFT 대여 등록하기
  const listNFTForRent = useMutation({
    mutationFn: async ({ nftId, kioskId, kioskCapId, duration, pricePerDay }: { 
      nftId: string, 
      kioskId: string, 
      kioskCapId: string, 
      duration: number, 
      pricePerDay: number 
    }) => {
      if (!account) throw new Error("지갑이 연결되지 않았습니다");
      
      try {
        console.log("Listing NFT for rent:", { nftId, kioskId, kioskCapId, duration, pricePerDay });
        
        // ProtectedTP 객체 확인
        if (!protectedTP || !protectedTP.id) {
          throw new Error("ProtectedTP 객체가 없습니다. 먼저 '렌탈 정책 설정' 버튼을 클릭하여 설정해주세요.");
        }
        
        const protectedTPId = protectedTP.id;
        console.log("ProtectedTP 사용:", protectedTPId);
        
        // NFT 대여 등록
        const listTx = new Transaction();
        listTx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::list`,
          arguments: [
            listTx.object(kioskId),
            listTx.object(kioskCapId),
            listTx.object(protectedTPId),
            listTx.pure.id(nftId),
            listTx.pure.u64(duration * 86400), // 일 단위를 초 단위로 변환
            listTx.pure.u64(pricePerDay),
          ],
          typeArguments: [NFT_TYPE],
        });
        
        listTx.setGasBudget(10000000);
        
        const listResult = await signAndExecuteTransaction({
          transaction: listTx,
        });
        
        console.log("List NFT transaction result:", listResult);
        return listResult;
      } catch (error) {
        console.error("List NFT transaction error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("NFT successfully listed for rent:", data);
      queryClient.invalidateQueries({ queryKey: ['userNFTs', account?.address] });
      queryClient.invalidateQueries({ queryKey: ['rentableNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['kioskNFTs', account?.address] });
      alert("NFT가 성공적으로 대여 목록에 등록되었습니다!");
    },
    onError: (error) => {
      console.error("NFT 대여 등록 실패:", error);
      
      let errorMessage = "알 수 없는 오류";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes("User rejected")) {
          errorMessage = "트랜잭션이 거부되었습니다. 지갑에서 트랜잭션을 승인해주세요.";
        } else if (errorMessage.includes("insufficient gas")) {
          errorMessage = "가스가 부족합니다. SUI 잔액을 확인해주세요.";
        } else if (errorMessage.includes("EExtensionNotInstalled")) {
          errorMessage = "Kiosk에 Rentables 확장이 설치되지 않았습니다. 먼저 확장을 설치해주세요.";
        } else if (errorMessage.includes("EObjectNotExist")) {
          errorMessage = "NFT가 Kiosk에 존재하지 않습니다. 먼저 NFT를 Kiosk에 추가해주세요.";
        } else if (errorMessage.includes("notExists")) {
          errorMessage = "참조된 객체가 존재하지 않습니다. PUBLISHER_ID가 올바른지 확인해주세요.";
        } else if (errorMessage.includes("InvalidUsageOfPureArg")) {
          errorMessage = "인수 형식이 잘못되었습니다. 개발자에게 문의하세요.";
        } else if (errorMessage.includes("CommandArgumentError")) {
          errorMessage = "명령 인수 오류가 발생했습니다. 개발자에게 문의하세요.";
        } else if (errorMessage.includes("budget")) {
          errorMessage = "가스 예산 설정에 실패했습니다. 다시 시도해주세요.";
        } else if (errorMessage.includes("ProtectedTP")) {
          errorMessage = "ProtectedTP 객체가 없습니다. 먼저 '렌탈 정책 설정' 버튼을 클릭하여 설정해주세요.";
        }
      }
      
      alert(`NFT 대여 등록 실패: ${errorMessage}`);
    }
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
  
  // console.log("useNFTRental - PACKAGE_ID:", PACKAGE_ID);
  // console.log("useNFTRental - PUBLISHER_ID:", PUBLISHER_ID);
  
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
    protectedTP,
    isLoadingProtectedTP,
    // createPublisher,
    shouldFetchProtectedTP,
    setShouldFetchProtectedTP,
  };
}