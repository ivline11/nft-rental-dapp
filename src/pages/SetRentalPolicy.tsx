import { useState, useEffect } from 'react';
import { useNFTRental } from '../hooks/useNFTRental';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { OWNER_ID, PUBLISHER_ID } from '../constants';
import { Card, Flex, Text, Button, Heading, Box, Callout, TextField, Slider } from '@radix-ui/themes';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';

export function SetRentalPolicy() {
  const { setupRenting, protectedTP, isLoadingProtectedTP, shouldFetchProtectedTP } = useNFTRental();
  const account = useCurrentAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [royaltyBasisPoints, setRoyaltyBasisPoints] = useState(500); // 기본값 5%

  // 현재 계정이 패키지 배포자인지 확인
  useEffect(() => {
    if (account) {
      setIsOwner(account.address === OWNER_ID);
    } else {
      setIsOwner(false);
    }
  }, [account]);

  // 로열티 비율 변경 핸들러
  const handleRoyaltyChange = (value: number[]) => {
    setRoyaltyBasisPoints(value[0]);
  };

  // 렌탈 정책 설정 핸들러
  const handleSetupRenting = async () => {
    try {
      await setupRenting.mutateAsync({ royaltyBasisPoints });
    } catch (error) {
      console.error("렌탈 정책 설정 중 오류 발생:", error);
    }
  };

  // 로열티 비율을 퍼센트로 표시
  const royaltyPercentage = (royaltyBasisPoints / 10000 * 100).toFixed(2);

  return (
    <Box p="4" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Heading size="6" mb="4">렌탈 정책 설정</Heading>
      
      {/* 권한 확인 알림 */}
      {!isOwner && (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <CrossCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            현재 계정은 패키지 배포자가 아닙니다. 렌탈 정책을 설정하려면 패키지 배포자 계정({OWNER_ID})으로 연결해야 합니다.
          </Callout.Text>
        </Callout.Root>
      )}
      
      {/* Publisher 상태 확인 */}
      {PUBLISHER_ID && (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <CrossCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            유효한 Publisher ID가 설정되지 않았습니다. 먼저 Publisher 객체를 생성하고 constants.ts 파일에 PUBLISHER_ID를 설정해주세요.
          </Callout.Text>
        </Callout.Root>
      )}
      
      {/* ProtectedTP 상태 확인 */}
      {shouldFetchProtectedTP && (
        isLoadingProtectedTP ? (
          <Callout.Root color="blue" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              ProtectedTP 객체 조회 중...
            </Callout.Text>
          </Callout.Root>
        ) : protectedTP ? (
          <Callout.Root color="green" mb="4">
            <Callout.Icon>
              <CheckCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              렌탈 정책이 이미 설정되어 있습니다. ProtectedTP ID: {protectedTP.id}
            </Callout.Text>
          </Callout.Root>
        ) : (
          <Callout.Root color="amber" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              ProtectedTP 객체를 찾을 수 없습니다. 아래에서 렌탈 정책을 설정해주세요.
            </Callout.Text>
          </Callout.Root>
        )
      )}
      
      {/* 안내 정보 */}
      <Card mb="4">
        <Flex direction="column" gap="3">
          <Heading size="4">렌탈 정책이란?</Heading>
          <Text>
            렌탈 정책은 NFT 대여 시스템의 기본 설정을 정의합니다. 이 설정은 대여 수수료, 권한 관리 등을 포함합니다.
          </Text>
          <Text>
            로열티 비율은 대여 거래에서 발생하는 수수료의 비율을 의미합니다. 이 값은 basis points(bps)로 표현되며, 10000bps = 100%입니다.
          </Text>
          <Text>
            이 작업은 패키지 배포자만 수행할 수 있으며, 한 번만 실행하면 됩니다.
          </Text>
        </Flex>
      </Card>
      
      {/* 로열티 설정 */}
      <Card mb="4">
        <Flex direction="column" gap="3">
          <Heading size="4">로열티 비율 설정</Heading>
          <Text>
            대여 거래에서 발생하는 로열티 비율을 설정하세요. 현재 설정: <strong>{royaltyPercentage}%</strong>
          </Text>
          <Flex align="center" gap="3">
            <Text size="2" style={{ width: '40px' }}>0%</Text>
            <Slider 
              value={[royaltyBasisPoints]} 
              onValueChange={handleRoyaltyChange}
              min={0}
              max={3000}
              step={50}
              style={{ flex: 1 }}
            />
            <Text size="2" style={{ width: '40px' }}>30%</Text>
          </Flex>
          <Flex align="center" gap="2">
            <TextField.Root value={royaltyPercentage} readOnly style={{ width: '80px' }} />
            <Text>%</Text>
          </Flex>
          <Text size="2" color="gray">
            일반적인 로열티 비율은 5~15% 사이입니다.
          </Text>
        </Flex>
      </Card>
      
      {/* 설정 버튼 */}
      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">렌탈 정책 설정</Heading>
          
          {protectedTP ? (
            <Callout.Root color="blue">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                렌탈 정책이 이미 설정되어 있습니다. 다시 설정할 필요가 없습니다.
              </Callout.Text>
              <Button
                onClick={() => {
                  // 렌탈 정책 재설정 함수 호출
                  handleSetupRenting();
                }}
                color="blue"
                size="3"  
              >
                렌탈 정책 재설정
              </Button>
            </Callout.Root>
          ) : (
            <>
              <Text>
                아래 버튼을 클릭하여 렌탈 정책을 설정하세요. 이 작업은 블록체인에 ProtectedTP 객체를 생성합니다.
              </Text>
              <Button 
                onClick={handleSetupRenting}
                disabled={!isOwner || setupRenting.isPending}
                color="blue"
                size="3"
                variant="solid"
              >
                {setupRenting.isPending ? '처리 중...' : '렌탈 정책 설정'}
              </Button>
              
              {setupRenting.isSuccess && (
                <Callout.Root color="green">
                  <Callout.Icon>
                    <CheckCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    렌탈 정책이 성공적으로 설정되었습니다!
                  </Callout.Text>
                </Callout.Root>
              )}
              
              {setupRenting.isError && (
                <Callout.Root color="red">
                  <Callout.Icon>
                    <CrossCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    렌탈 정책 설정 중 오류가 발생했습니다: {setupRenting.error instanceof Error ? setupRenting.error.message : '알 수 없는 오류'}
                  </Callout.Text>
                </Callout.Root>
              )}
            </>
          )}
        </Flex>
      </Card>
      
      {/* 다음 단계 안내 */}
      <Card mt="4">
        <Flex direction="column" gap="3">
          <Heading size="4">다음 단계</Heading>
          <Text>
            렌탈 정책을 설정한 후에는 다음 단계를 진행할 수 있습니다:
          </Text>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <LightningBoltIcon />
              <Text>NFT 생성하기</Text>
            </Flex>
            <Flex align="center" gap="2">
              <LightningBoltIcon />
              <Text>Kiosk 설정하기</Text>
            </Flex>
            <Flex align="center" gap="2">
              <LightningBoltIcon />
              <Text>NFT를 Kiosk에 추가하기</Text>
            </Flex>
            <Flex align="center" gap="2">
              <LightningBoltIcon />
              <Text>NFT 대여 등록하기</Text>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}