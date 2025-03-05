import { useState } from 'react';
import { Theme, Card, Text, Flex, TextField, Button } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';

export function CreateNFT() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createNFT } = useNFTRental();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createNFT.mutateAsync({
        name,
        description,
      });
      
      // 폼 초기화
      setName('');
      setDescription('');
    } catch (error) {
      console.error('NFT 생성 실패:', error);
    }
  };
  
  return (
    <Theme>
      <Card>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">새 NFT 생성</Text>
            
            <Flex direction="column" gap="1">
              <Text size="2">NFT 이름</Text>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NFT 이름을 입력하세요"
                required
              />
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text size="2">NFT 설명</Text>
              <TextField.Root
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="NFT에 대한 설명을 입력하세요"
                required
              />
            </Flex>
            
            <Button type="submit" disabled={createNFT.isPending}>
              {createNFT.isPending ? '생성 중...' : 'NFT 생성하기'}
            </Button>
          </Flex>
        </form>
      </Card>
    </Theme>
  );
} 