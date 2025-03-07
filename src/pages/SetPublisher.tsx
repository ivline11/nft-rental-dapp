import { useState, useEffect } from 'react';
import { useNFTRental } from '../hooks/useNFTRental';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { OWNER_ID, PUBLISHER_ID } from '../constants';
import { Card, Flex, Text, Button, Heading, Box, Callout } from '@radix-ui/themes';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

export function SetPublisher() {
  const { createPublisher } = useNFTRental();
  const account = useCurrentAccount();
  const [isOwner, setIsOwner] = useState(false);

  // 현재 계정이 패키지 배포자인지 확인
  useEffect(() => {
    if (account) {
      setIsOwner(account.address === OWNER_ID);
    } else {
      setIsOwner(false);
    }
  }, [account]);


  // Publisher 객체 생성 핸들러
  const handleCreatePublisher = async () => {
    try {
      await createPublisher.mutateAsync();
    } catch (error) {
      console.error("Publisher 생성 중 오류 발생:", error);
    }
  };

  return (
    <Box p="4" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Heading size="6" mb="4">Publisher 설정</Heading>
      
      {/* 권한 확인 알림 */}
      {!isOwner && (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <CrossCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            현재 계정은 패키지 배포자가 아닙니다. Publisher 객체를 생성하려면 패키지 배포자 계정({OWNER_ID})으로 연결해야 합니다.
          </Callout.Text>
        </Callout.Root>
      )}
      
      {/* 안내 정보 */}
      <Card mb="4">
        <Flex direction="column" gap="3">
          <Heading size="4">Publisher 객체란?</Heading>
          <Text>
            Publisher 객체는 패키지 배포자가 해당 패키지에 대한 권한을 증명하는 객체입니다. 
            NFT 렌탈 시스템을 설정하기 위해서는 먼저 Publisher 객체를 생성해야 합니다.
          </Text>
          <Text>
            이 작업은 패키지 배포자만 수행할 수 있으며, 한 번만 실행하면 됩니다.
          </Text>
        </Flex>
      </Card>
      
      {/* 단계별 안내 */}
      <Card mb="4">
        <Flex direction="column" gap="3">
          <Heading size="4">Publisher 설정 단계</Heading>
          <Flex direction="column" gap="2">
            <Text>1. 패키지 배포자 계정으로 지갑 연결</Text>
            <Text>2. 'Publisher 객체 생성' 버튼 클릭</Text>
            <Text>3. 트랜잭션 승인</Text>
            <Text>4. 콘솔에서 생성된 Publisher 객체 ID 확인</Text>
            <Text>5. constants.ts 파일에 PUBLISHER_ID 업데이트</Text>
          </Flex>
        </Flex>
      </Card>
      
      {/* 작업 실행 카드 */}
      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Publisher 객체 생성</Heading>
          
          <Text>
            아래 버튼을 클릭하여 Publisher 객체를 생성하세요. 트랜잭션이 완료되면 콘솔에서 생성된 객체 ID를 확인할 수 있습니다.
          </Text>
          <Button 
            onClick={handleCreatePublisher}
            disabled={!isOwner || createPublisher.isPending}
            color="blue"
            size="3"
          >
            {createPublisher.isPending ? '처리 중...' : 'Publisher 객체 생성'}
          </Button>
          
          {createPublisher.isSuccess && (
            <Callout.Root color="green">
              <Callout.Icon>
                <CheckCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Publisher 객체가 성공적으로 생성되었습니다. 콘솔(F12)에서 객체 ID를 확인하고 constants.ts 파일의 PUBLISHER_ID를 업데이트하세요.
              </Callout.Text>
            </Callout.Root>
          )}
          
          {createPublisher.isError && (
            <Callout.Root color="red">
              <Callout.Icon>
                <CrossCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Publisher 객체 생성 중 오류가 발생했습니다: {createPublisher.error instanceof Error ? createPublisher.error.message : '알 수 없는 오류'}
              </Callout.Text>
            </Callout.Root>
          )}
        </Flex>
      </Card>
      
      {/* 개발자 안내 */}
      <Card mt="4">
        <Flex direction="column" gap="3">
          <Heading size="4">개발자 참고사항</Heading>
          <Text>
            Publisher 객체 ID를 확인한 후에는 src/constants.ts 파일에서 PUBLISHER_ID 값을 업데이트해야 합니다.
            이 값은 렌탈 정책 설정 및 NFT 대여 등록에 사용됩니다.
          </Text>
          <Text style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '8px' }}>
            export const PUBLISHER_ID = '0x...'; // 생성된 Publisher 객체 ID로 업데이트
          </Text>
        </Flex>
      </Card>
    </Box>
  );
}
