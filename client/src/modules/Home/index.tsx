import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react'
import Card from './components/Card';
import { modules } from './helpers/modules';

const Home = () => {
  return (
    <Box p={4}>
      <Stack spacing={4} as={Container} maxW={'6xl'} textAlign={'center'}>
        <Heading fontSize={{ base: '2xl', sm: '4xl' }} fontWeight={'bold'} color={'gray.900'}>
          Short heading
        </Heading>
      </Stack>

      <Container maxW={'8xl'} mt={12}>
        <SimpleGrid columns={4} spacing={5}>
          {modules.map(({ label, icon, href, keyBind }, key) => (
            <Card
              key={key}
              label={label}
              keyBind={keyBind}
              icon={icon}
              href={href}
            />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}

export default Home;
