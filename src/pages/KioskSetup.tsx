import { Theme, Card, Text, Flex, Button } from '@radix-ui/themes';
import { useKiosk } from '../hooks/useKiosk';

export function KioskSetup() {
  const { kioskData, isLoadingKiosk, createKiosk, installRentables, removeKiosk } = useKiosk();


  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">Kiosk 설정</Text>
          
          {isLoadingKiosk ? (
            <Text>Kiosk 정보 로딩 중...</Text>
          ) : kioskData ? (
            <Flex direction="column" gap="2">
              <Text>Kiosk가 설정되었습니다.</Text>
              <Text size="2">Kiosk ID: {kioskData.kioskId}</Text>
              
              {kioskData.hasRentablesExt ? (
                <Flex direction="column" gap="2">
                  <Text color="green">Rentables 확장이 이미 설치되어 있습니다.</Text>
                  <Button 
                    onClick={() => removeKiosk.mutate()} 
                    disabled={removeKiosk.isPending}
                    color="red"
                  >
                    {removeKiosk.isPending ? '제거 중...' : 'Rentables 확장 제거'}
                  </Button>
                </Flex>
              ) : (
                <Button 
                  onClick={() => installRentables.mutate()} 
                  disabled={installRentables.isPending}
                >
                  {installRentables.isPending ? '설치 중...' : 'Rentables 확장 설치'}
                </Button>
              )}
            </Flex>
          ) : (
            <Flex direction="column" gap="2">
              <Text>Kiosk가 설정되지 않았습니다.</Text>
              <Button 
                onClick={() => createKiosk.mutate()} 
                disabled={createKiosk.isPending}
              >
                {createKiosk.isPending ? '생성 중...' : 'Kiosk 생성'}
              </Button>
            </Flex>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 