import { Theme, Card, Text, Flex, Grid, Heading, Button } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';

// NFT 타입 정의 (이미지 URL 제거)
interface NFTData {
  id: string | undefined;
  name?: string;
  description?: string;
  type?: string | null;
}

export function Home() {
  const { userNFTs, isLoadingUserNFTs } = useNFTRental();
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">내 NFT 목록</Text>
          
          {isLoadingUserNFTs ? (
            <Text>NFT 로딩 중...</Text>
          ) : userNFTs && userNFTs.length > 0 ? (
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
              {userNFTs.map((nft: NFTData) => (
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
                      <Heading size="4" style={{ marginBottom: '8px' }}>
                        {nft.name || 'Unnamed NFT'}
                      </Heading>
                      <Text size="2" style={{ color: '#666', flex: 1, overflow: 'hidden' }}>
                        {nft.description || 'No description'}
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
            <Flex direction="column" gap="2" align="center" py="6">
              <Text>보유한 NFT가 없습니다.</Text>
              <Button onClick={() => window.location.hash = '#create'}>
                NFT 생성하기
              </Button>
            </Flex>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 