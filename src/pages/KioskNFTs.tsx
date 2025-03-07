import { Theme, Card, Text, Flex, Button, Grid, Box } from '@radix-ui/themes';
import { useKiosk } from '../hooks/useKiosk';
import { NFTData } from '../types/nftData';

export function KioskNFTs() {
  const { kioskData, isLoadingKiosk, getKioskNFTs, refetchKioskData } = useKiosk();
  
  // getKioskNFTs 쿼리 객체에서 데이터와 로딩 상태 추출
  const nfts = getKioskNFTs.data || [];
  const isLoadingNFTs = getKioskNFTs.isLoading;
  
  // 새로고침 핸들러
  const handleRefresh = () => {
    getKioskNFTs.refetch();
    refetchKioskData();
  };
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Text size="5" weight="bold">내 Kiosk NFT 목록</Text>
            <Button onClick={handleRefresh}>새로고침</Button>
          </Flex>
          
          {isLoadingKiosk || isLoadingNFTs ? (
            <Text>NFT 정보 로딩 중...</Text>
          ) : !kioskData ? (
            <Text color="orange">Kiosk가 설정되지 않았습니다. Kiosk 설정 페이지에서 먼저 Kiosk를 생성해주세요.</Text>
          ) : nfts.length === 0 ? (
            <Text color="gray">Kiosk에 NFT가 없습니다.</Text>
          ) : (
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3" mt="3">
              {nfts.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </Grid>
          )}
        </Flex>
      </Card>
    </Theme>
  );
}

// NFT 카드 컴포넌트
function NFTCard({ nft }: { nft: NFTData }) {
  const { removeNFT } = useKiosk();
  
  const handleRemove = async () => {
    if (!window.confirm(`정말로 "${nft.name}" NFT를 제거하시겠습니까?`)) {
      return;
    }
    
    try {
      await removeNFT.mutateAsync(nft.id || '');
      alert('NFT가 성공적으로 제거되었습니다.');
    } catch (error) {
      console.error('NFT 제거 실패:', error);
      alert('NFT 제거에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="2">
        <Box style={{ 
          width: '100%', 
          height: '200px', 
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <Text size="5" weight="bold" color="cyan">{nft.name}</Text>
          <Button 
            color="red" 
            variant="soft"
            size="1"
            onClick={handleRemove}
            disabled={removeNFT.isPending}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px'
            }}
          >
            {removeNFT.isPending ? '제거 중...' : '제거'}
          </Button>
        </Box>
        <Text size="4" weight="bold">{nft.name}</Text>
        {nft.description && <Text size="2">{nft.description}</Text>}
        <Text size="1" color="gray">ID: {nft.id?.substring(0, 8)}...</Text>
        <Text size="1" color="gray">타입: {nft.type?.split('::').pop()}</Text>
      </Flex>
    </Card>
  );
} 