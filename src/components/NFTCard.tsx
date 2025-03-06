import { Theme, Card, Text, Flex, Box, Button } from '@radix-ui/themes';

type NFTCardProps = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isRentable?: boolean;
  isRented?: boolean;
  pricePerDay?: number;
  duration?: number;
  onRent?: () => void;
  onList?: () => void;
  onReturn?: () => void;
  onClick?: () => void;
};

export function NFTCard({
  id,
  name,
  description,
  imageUrl,
  isRentable,
  isRented,
  pricePerDay,
  duration,
  onRent,
  onList,
  onReturn,
  onClick,
}: NFTCardProps) {
  return (
    <Theme>
      <Card style={{ maxWidth: 300, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <Flex direction="column" gap="2">
          {imageUrl ? (
            <Box style={{ height: 200, overflow: 'hidden' }}>
              <img 
                src={imageUrl} 
                alt={name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </Box>
          ) : (
            <Box style={{ 
              width: '100%', 
              height: '200px', 
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              textAlign: 'center'
            }}>
              <Text size="5" weight="bold" color="cyan">{name}</Text>
            </Box>
          )}
          
          <Text size="5" weight="bold">{name}</Text>
          <Text size="2" color="gray">{description}</Text>
          
          {isRentable && (
            <Flex direction="column" gap="1">
              <Text size="2">대여 가격: {pricePerDay} SUI / 일</Text>
              <Text size="2">대여 기간: {duration} 일</Text>
              <Button onClick={onRent}>대여하기</Button>
            </Flex>
          )}
          
          {isRented && (
            <Flex direction="column" gap="1">
              <Text size="2">대여 중</Text>
              <Button onClick={onReturn}>반환하기</Button>
            </Flex>
          )}
          
          {!isRentable && !isRented && onList && (
            <Button onClick={onList}>대여 등록하기</Button>
          )}
          
          <Text size="1" color="gray">ID: {id?.substring(0, 8)}...</Text>
        </Flex>
      </Card>
    </Theme>
  );
}