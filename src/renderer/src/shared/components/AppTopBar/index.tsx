'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@web/shared/components/ui/popover'
import { Button } from '@web/shared/components/ui/button'
import languages from '@web/config/languages'
import Products from '@web/modules/Products'
import Receipt from '@web/modules/Receipt'
import AllReceiptBills from '@web/modules/Receipt/AllReceiptBills'
import { useLogout } from '@web/shared/hooks/useAuthentication'
import authService from '@web/shared/services/auth'
import i18next, { t } from 'i18next'
import { Fragment, useState, useRef, useCallback } from 'react'
import { AiOutlineClose, AiOutlineMore, AiOutlineDown, AiOutlinePoweroff, AiFillRightCircle } from 'react-icons/ai'
import { useNavigate } from 'react-router-dom'
import { cn } from '@web/shared/utils/cn'

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

const HoverPopover = ({ children, content, align = "center" }: { children: React.ReactNode; content: React.ReactNode; align?: "center" | "start" | "end" }) => {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="p-0 border-0 shadow-xl bg-white dark:bg-gray-800"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}

const Languages = ({ className }: { className?: string }) => (
  <div className={className}>
    <HoverPopover
      content={
        <div className="flex flex-col py-1">
          {languages.map(({ id, label, code }) => (
            <div
              key={id}
              role={'group'}
              className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md mx-1"
              onClick={() => {
                i18next.changeLanguage(code);
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              }}
            >
              <div className="flex items-center">
                <div className="flex items-center">
                  <img
                    className="w-8 h-8 rounded-full mr-3"
                    src={`/assets/${code}.svg`}
                    alt={label}
                  />
                  <span className="font-medium transition-colors group-hover:text-blue-400">
                    {label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    >
      <button className="text-sm font-medium hover:text-gray-900 dark:hover:text-white transition-colors">
        {t('language')}
      </button>
    </HoverPopover>
  </div>
)

interface AppTopBarProps {
  children: JSX.Element | JSX.Element[];
}

const AppTopBar: React.FC<AppTopBarProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { mutateAsync: logout } = useLogout();
  const navigate = useNavigate();

  const onToggle = () => setIsOpen(!isOpen);

  const onLogout = async () => {
    try {
      const { token } = authService.loadUserInfo() || { token: undefined };
      await logout(token as void);
      authService.resetUserInfo();
      navigate('/connexion');
    } catch (e) {
      authService.resetUserInfo();
      navigate('/connexion');
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 text-gray-600 dark:text-white min-h-[60px] py-2 px-4 border-b border-gray-200 dark:border-gray-900 flex items-center">
        <div className="flex flex-1 md:hidden ml-[-8px]">
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            aria-label={'Toggle Navigation'}
          >
            {isOpen ? <AiOutlineClose className="w-5 h-5" /> : <AiOutlineMore className="w-5 h-5" />}
          </Button>
        </div>
        
        <div className="flex flex-1 justify-center md:justify-between items-center px-5">
          <div className="flex-1 flex justify-end md:justify-start text-center md:text-left font-heading text-gray-800 dark:text-white">
            Logo
          </div>

          <div className="hidden md:flex flex-1 justify-center">
            <DesktopNav />
          </div>

          <div className="flex items-center flex-1 justify-end gap-2">
            <Languages className="mr-2" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <AiOutlinePoweroff className="mr-1" /> {t('logout')}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Collapse */}
      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <MobileNav />
      </div>
      
      {children}
    </div>
  )
}

const DesktopNav = () => {
  return (
    <div className="flex flex-row gap-4">
      {NAV_ITEMS.map((navItem, k) => (
        <div key={k}>
          {navItem.children ? (
            <HoverPopover
              align="start"
              content={
                <div className="p-4 rounded-xl min-w-[384px]">
                  <div className="flex flex-col">
                    {navItem.children.map((child, k) => (
                      child.component ? (<Fragment key={k}>{child.component}</Fragment>) : <DesktopSubNav key={k} {...child} />
                    ))}
                  </div>
                </div>
              }
            >
              <button className="p-2 text-sm font-medium text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white hover:no-underline cursor-pointer">
                {navItem.label}
              </button>
            </HoverPopover>
          ) : (
            <a href={navItem.href} className="p-2 text-sm font-medium text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white">
              {navItem.label}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <a
      href={href}
      className="group block p-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-900 transition-colors"
    >
      <div className="flex items-center">
        <div>
          <p className="font-medium transition-colors group-hover:text-blue-500 text-gray-900 dark:text-gray-100">
            {label}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subLabel}</p>
        </div>
        <div className="flex-1 flex justify-end items-center opacity-0 transform -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <AiFillRightCircle className="w-5 h-5 text-blue-400" />
        </div>
      </div>
    </a>
  )
}

const MobileNav = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 block md:hidden">
      {NAV_ITEMS.map((navItem, k) => (
        <MobileNavItem key={k} {...navItem} />
      ))}
    </div>
  )
}

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const [isOpen, setIsOpen] = useState(false);
  const onToggle = () => setIsOpen(!isOpen);

  return (
    <div className="flex flex-col gap-4" onClick={children && onToggle}>
      <div className="py-2 flex justify-between items-center hover:no-underline cursor-pointer">
        <a 
          href={href ?? '#'} 
          className="font-semibold text-gray-600 dark:text-gray-200"
          onClick={(e) => {
             if (children) {
                 e.preventDefault();
                 onToggle();
             }
          }}
        >
          {label}
        </a>
        {children && (
          <AiOutlineDown
            className={cn(
              "w-6 h-6 transition-transform duration-250 ease-in-out",
              isOpen ? "rotate-180" : ""
            )}
          />
        )}
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out pl-4 border-l border-gray-200 dark:border-gray-700 mt-0",
        isOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
      )}>
        <div className="flex flex-col items-start">
          {children &&
            children.map((child, k) => (
              <a key={k} className="py-2 block w-full" href={child.href}>
                {child.label}
              </a>
            ))}
        </div>
      </div>
    </div>
  )
}

export default AppTopBar;
