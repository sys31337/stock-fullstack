'use client'

import {
  Box,
  Flex,
  Text,
  IconButton,
  Stack,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Image,
  Button,
  BoxProps,
} from '@chakra-ui/react'
import languages from '@web/config/languages'
import Products from '@web/modules/Products'
import Receipt from '@web/modules/Receipt'
import AllReceiptBills from '@web/modules/Receipt/AllBills'
import { useLogout } from '@web/shared/hooks/useAuthentication'
import authService from '@web/shared/services/auth'
import i18next, { t } from 'i18next'
import { Fragment } from 'react'
import { AiOutlineClose, AiOutlineMore, AiOutlineDown, AiOutlinePoweroff, AiFillRightCircle } from 'react-icons/ai'
import { useNavigate } from 'react-router-dom'


const Languages = (props: BoxProps) => (
  <Box {...props}>
    <Popover trigger={'hover'} placement={'bottom'}>
      <PopoverTrigger>
        <Box
          as="a"
          href={'#'}
          fontSize={'sm'}
          fontWeight={500}
          _hover={{
            textDecoration: 'none',
            color: 'theme.900',
          }}>
          {t('language')}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        border={0}
        boxShadow={'xl'}
        bg={'white'}
        rounded={'md'}
        maxW={'150px'}
      >
        <Stack as={'a'} href={'#'}>
          {languages.map(({ id, label, code }) => <Box
            key={id}
            role={'group'}
            display={'block'}
            p={2}
            rounded={'md'}
            _hover={{ bg: 'gray.100' }}
            onClick={() => {
              i18next.changeLanguage(code);
              // eslint-disable-next-line no-restricted-globals
              location.reload();
            }}
          >
            <Stack direction={'row'} align={'center'}>
              <Flex>
                <Image
                  boxSize='2rem'
                  borderRadius={'100'}
                  src={`/assets/${code}.svg`}
                  alt={label}
                  mr='12px'
                />
                <Text
                  transition={'all .3s ease'}
                  _groupHover={{ color: 'blue.400' }}
                  fontWeight={500}>
                  {label}
                </Text>
              </Flex>
            </Stack>
          </Box>
          )}
        </Stack>
      </PopoverContent>
    </Popover>
  </Box>
)

interface AppTopBarProps {
  children: JSX.Element | JSX.Element[];
}

const AppTopBar: React.FC<AppTopBarProps> = ({ children }) => {
  const { isOpen, onToggle } = useDisclosure()
  const { mutateAsync: logout } = useLogout();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      const { token } = authService.loadUserInfo() || { undefined };
      await logout(token as void);
      authService.resetUserInfo();
      navigate('/connexion');
    } catch (e) {
      authService.resetUserInfo();
      navigate('/connexion');
    }
  };

  return (
    <Box w={'full'}>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'20px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}>
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}>
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <AiOutlineClose /> : <AiOutlineMore />}
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'space-between' }} alignItems={'center'} px={5}>
          <Text
            flex={1} justifyContent={'flex-end'}
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}>
            Logo
          </Text>
          <Flex display={{ base: 'none', md: 'flex' }} flex={1} justifyContent={'center'}>
            <DesktopNav />
          </Flex>
          <Flex alignItems={'center'} flex={1} justifyContent={'flex-end'}>
            <Languages me={2} />
            <Button colorScheme={'red'} variant={'ghost'} size={'sm'} onClick={onLogout}>
              <Box as={AiOutlinePoweroff} me={1} /> {t('logout')}
            </Button>
          </Flex>
        </Flex>

      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>
      {children}
    </Box >
  )
}

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200')
  const linkHoverColor = useColorModeValue('gray.800', 'white')
  const popoverContentBgColor = useColorModeValue('white', 'gray.800')

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem, k) => (
        <Box key={k}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Box
                as="a"
                p={2}
                href={navItem.href ?? '#'}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}>
                {navItem.label}
              </Box>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                mt={2}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}>
                <Stack>
                  {navItem.children.map((child, k) => (
                    child.component ? (<Fragment key={k}>{child.component}</Fragment>) : <DesktopSubNav key={k} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  )
}

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Box
      as="a"
      href={href}
      role={'group'}
      display={'block'}
      p={2}
      px={3}
      rounded={'lg'}
      _hover={{ bg: useColorModeValue('blue.50', 'gray.900') }}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'blue.500' }}
            fontWeight={500}>
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}>
          <Icon color={'blue.400'} w={5} h={5} as={AiFillRightCircle} />
        </Flex>
      </Stack>
    </Box>
  )
}

const MobileNav = () => {
  return (
    <Stack bg={useColorModeValue('white', 'gray.800')} p={4} display={{ md: 'none' }}>
      {NAV_ITEMS.map((navItem, k) => (
        <MobileNavItem key={k} {...navItem} />
      ))}
    </Stack>
  )
}

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure()

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Box
        py={2}
        as="a"
        href={href ?? '#'}
        justifyContent="space-between"
        alignItems="center"
        _hover={{
          textDecoration: 'none',
        }}>
        <Text fontWeight={600} color={useColorModeValue('gray.600', 'gray.200')}>
          {label}
        </Text>
        {children && (
          <Icon
            as={AiOutlineDown}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </Box>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}>
          {children &&
            children.map((child, k) => (
              <Box as="a" key={k} py={2} href={child.href}>
                {child.label}
              </Box>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  )
}

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
  component?: JSX.Element;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Stock',
    children: [
      {
        label: t('productsList'),
        subLabel: t('productsListSublabel'),
        href: 'products',
        component: <Products isTopBar />
      },
      {
        label: t('newReceiptBill'),
        subLabel: t('newReceiptBillLabel'),
        href: 'receipt',
        component: <Receipt isTopBar />
      },
      {
        label: t('allReceiptBill'),
        subLabel: t('allReceiptBillLabel'),
        href: 'receipt',
        component: <AllReceiptBills isTopBar />
      },
    ],
  },
]

export default AppTopBar;
