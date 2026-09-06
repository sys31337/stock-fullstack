'use client'

import { Button } from '@web/shared/components/ui/button'
import languages from '@web/config/languages'
import Products from '@web/modules/Products'
import Receipt from '@web/modules/Receipt'
import AllReceiptBills from '@web/modules/Receipt/AllReceiptBills'
import Invoice from '@web/modules/Invoice'
import AllInvoices from '@web/modules/Invoice/AllInvoices'
import CustomersList, { CustomerType } from '@web/shared/components/CustomersList'
import TransactionModal from '@web/modules/Transactions/TransactionModal'
import TransactionsList from '@web/modules/Transactions/TransactionsList'
import Warehouses from '@web/modules/Warehouses'
import Roles from '@web/modules/Roles'
import UsersModule from '@web/modules/Users'
import AuditLogs from '@web/modules/AuditLogs'
import Charges from '@web/modules/Charges'
import SettingsDrawer from '@web/modules/Settings'
import ConnectionDrawer from '@web/modules/Connection'
import { useLogout } from '@web/shared/hooks/useAuthentication'
import authService from '@web/shared/services/auth'
import i18next, { t } from 'i18next'
import { assetsBase } from '@web/config'
import { useState, useRef, useEffect, createContext, useContext } from 'react'
import {
  AiOutlineClose,
  AiOutlineMore,
  AiOutlineDown,
  AiOutlinePoweroff,
  AiOutlineSetting,
} from 'react-icons/ai'
import { useNavigate } from 'react-router-dom'
import { cn } from '@web/shared/utils/cn'
import { Wifi, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@web/shared/contexts/ThemeContext'
import WarehouseSelector from '@web/shared/components/WarehouseSelector'
import { useAvailableWarehouses } from '@web/shared/hooks/useWarehouses'
import { useGetMyPermissions } from '@web/shared/hooks/useUsersEnhanced'

interface ModalActions {
  openProducts: () => void
  openCustomers: (type?: CustomerType) => void
  openNewTransfer: () => void
  openTransactions: () => void
  openReceipt: () => void
  openAllBills: () => void
  openInvoice: () => void
  openAllInvoices: () => void
  openWarehouses: () => void
  openRoles: () => void
  openUsers: () => void
  openAuditLogs: () => void
  openCharges: () => void
}

const ModalContext = createContext<ModalActions>({
  openProducts: () => {},
  openCustomers: () => {},
  openNewTransfer: () => {},
  openTransactions: () => {},
  openReceipt: () => {},
  openAllBills: () => {},
  openInvoice: () => {},
  openAllInvoices: () => {},
  openWarehouses: () => {},
  openRoles: () => {},
  openUsers: () => {},
  openAuditLogs: () => {},
  openCharges: () => {},
})

interface SubMenuItem {
  label: string
  action: (actions: ModalActions) => void
}

interface NavItem {
  label: string
  href?: string
  children?: SubMenuItem[]
}

const navigateTo = (path: string) => {
  window.location.hash = path
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'tiers',
    children: [
      { label: 'products', action: (a) => a.openProducts() },
      { label: 'customersAndSuppliers', action: (a) => a.openCustomers() },
      { label: 'newTransfer', action: (a) => a.openNewTransfer() },
      { label: 'transactions', action: (a) => a.openTransactions() },
    ],
  },
  {
    label: 'reception',
    children: [
      { label: 'newReceiptBillMenu', action: (a) => a.openReceipt() },
      { label: 'allReceiptBillsMenu', action: (a) => a.openAllBills() },
    ],
  },
  {
    label: 'commande',
    children: [
      { label: 'newOrderMenu', action: () => {} },
    ],
  },
  {
    label: 'livraison',
    children: [
      { label: 'newDeliveryNoteMenu', action: () => {} },
      { label: 'allDeliveryNotesMenu', action: () => {} },
    ],
  },
  {
    label: 'factures',
    children: [
      { label: 'newInvoiceMenu', action: (a) => a.openInvoice() },
      { label: 'allInvoicesMenu', action: (a) => a.openAllInvoices() },
    ],
  },
  {
    label: 'management',
    children: [
      { label: 'warehouses', action: (a) => a.openWarehouses() },
      { label: 'roles', action: (a) => a.openRoles() },
      { label: 'users', action: (a) => a.openUsers() },
      { label: 'auditLogs', action: (a) => a.openAuditLogs() },
    ],
  },
  {
    label: 'charges',
    children: [
      { label: 'charges', action: (a) => a.openCharges() },
    ],
  },
  {
    label: 'reports',
    children: [
      { label: 'overview', action: () => navigateTo('/reports') },
      { label: 'ledger', action: () => navigateTo('/reports/ledger') },
      { label: 'cashStatement', action: () => navigateTo('/reports/cash-statement') },
      { label: 'productStats', action: () => navigateTo('/reports/products') },
      { label: 'salespeopleReport', action: () => navigateTo('/reports/salespeople') },
      { label: 'deliveryReturns', action: () => navigateTo('/reports/delivery-returns') },
    ],
  },
]

function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

const Dropdown = ({
  trigger,
  children,
  align = 'start',
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'start' | 'end'
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((prev) => !prev)}>
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            'absolute top-full mt-1 z-[250] bg-popover border border-border rounded-xl shadow-xl py-1 min-w-[180px] animate-in fade-in-0 zoom-in-95',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

const Languages = () => (
  <Dropdown
    align="end"
    trigger={
      <button className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
        <img
          className="w-5 h-5 rounded-full ring-1 ring-border"
          src={`${assetsBase}assets/${i18next.language || 'fr'}.svg`}
          alt=""
        />
        <AiOutlineDown className="h-3 w-3 opacity-50" />
      </button>
    }
  >
    <div className="py-1">
      {languages.map(({ id, label, code }) => (
        <div
          key={id}
          role="group"
          className="flex items-center gap-3 p-2 px-3 mx-1 rounded-lg hover:bg-accent cursor-pointer transition-colors"
          onClick={() => {
            i18next.changeLanguage(code)
            location.reload()
          }}
        >
          <img
            className="w-5 h-5 rounded-full ring-1 ring-border"
            src={`${assetsBase}assets/${code}.svg`}
            alt={label}
          />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
      ))}
    </div>
  </Dropdown>
)

const DesktopNav = () => {
  const actions = useContext(ModalContext)

  return (
    <>
      {NAV_ITEMS.map((item) =>
        item.children ? (
          <Dropdown
            key={item.label}
            trigger={
              <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer">
                {t(item.label)}
                <AiOutlineDown className="h-3 w-3 opacity-50" />
              </button>
            }
          >
            <div className="py-1">
              {item.children.map((child) => (
                <button
                  key={child.label}
                  onClick={() => child.action(actions)}
                  className="w-full text-left px-3 py-2 mx-1 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t(child.label)}
                </button>
              ))}
            </div>
          </Dropdown>
        ) : (
          <a
            key={item.label}
            href={item.href}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            {t(item.label)}
          </a>
        )
      )}
    </>
  )
}

interface AppTopBarProps {
  children: JSX.Element | JSX.Element[]
}

const AppTopBar: React.FC<AppTopBarProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { mutateAsync: logout } = useLogout()
  const navigate = useNavigate()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { mode: warehouseMode } = useAvailableWarehouses()
  const { data: myPermissions } = useGetMyPermissions()
  const canManageSettings = myPermissions?.isMainAccount === true
    || (myPermissions?.effectivePermissions || []).includes('*')
    || (myPermissions?.effectivePermissions || []).includes('settings.view')

  const [openProducts, setOpenProducts] = useState(false)
  const [openReceipt, setOpenReceipt] = useState(false)
  const [openAllBills, setOpenAllBills] = useState(false)
  const [openCustomers, setOpenCustomers] = useState(false)
  const [customersType, setCustomersType] = useState<CustomerType>('All')
  const [openNewTransfer, setOpenNewTransfer] = useState(false)
  const [openTransactions, setOpenTransactions] = useState(false)
  const [openWarehouses, setOpenWarehouses] = useState(false)
  const [openRoles, setOpenRoles] = useState(false)
  const [openUsers, setOpenUsers] = useState(false)
  const [openAuditLogs, setOpenAuditLogs] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)
  const [openConnection, setOpenConnection] = useState(false)
  const [openInvoice, setOpenInvoice] = useState(false)
  const [openAllInvoices, setOpenAllInvoices] = useState(false)
  const [openCharges, setOpenCharges] = useState(false)

  const modalActions: ModalActions = {
    openProducts: () => setOpenProducts(true),
    openCustomers: (type = 'All') => {
      setCustomersType(type)
      setOpenCustomers(true)
    },
    openNewTransfer: () => setOpenNewTransfer(true),
    openTransactions: () => setOpenTransactions(true),
    openReceipt: () => setOpenReceipt(true),
    openAllBills: () => setOpenAllBills(true),
    openInvoice: () => setOpenInvoice(true),
    openAllInvoices: () => setOpenAllInvoices(true),
    openWarehouses: () => setOpenWarehouses(true),
    openRoles: () => setOpenRoles(true),
    openUsers: () => setOpenUsers(true),
    openAuditLogs: () => setOpenAuditLogs(true),
    openCharges: () => setOpenCharges(true),
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setOpenReceipt(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const onToggle = () => setIsOpen(!isOpen)

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="h-3.5 w-3.5" />
    return resolvedTheme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />
  }

  const onLogout = async () => {
    try {
      const { token } = authService.loadUserInfo() || { token: undefined }
      await logout(token as void)
      authService.resetUserInfo()
      navigate('/connexion')
    } catch (e) {
      authService.resetUserInfo()
      navigate('/connexion')
    }
  }

  return (
    <ModalContext.Provider value={modalActions}>
      <div className="w-full h-full flex flex-col">
        <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 flex items-center px-4 sm:px-6">
          <div className="flex items-center md:hidden mr-2">
            <Button
              onClick={onToggle}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Toggle Navigation"
            >
              {isOpen ? (
                <AiOutlineClose className="h-4 w-4" />
              ) : (
                <AiOutlineMore className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center mr-6">
            <img
              src={`${assetsBase}assets/logo-h.png`}
              alt="SoluStock"
              className="h-10 rounded-lg object-contain"
            />
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            <DesktopNav />
          </nav>

          <div className="flex items-center gap-1 ml-auto">
            {warehouseMode === 'multi' && (
              <div className="hidden md:block">
                <WarehouseSelector size="sm" />
              </div>
            )}
            <Languages />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenConnection(true)}
              title="Remote connection"
              aria-label="Remote connection"
              className="text-muted-foreground hover:text-foreground hover:bg-accent gap-1.5 h-8 px-2.5"
            >
              <Wifi className="h-3.5 w-3.5" />
            </Button>
            {canManageSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenSettings(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent gap-1.5 h-8 px-2.5"
              >
                <AiOutlineSetting className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleTheme}
              title={`Theme: ${theme}`}
              aria-label={`Theme: ${theme}. Click to cycle.`}
              className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-2.5"
            >
              {getThemeIcon()}
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-2.5"
            >
              <AiOutlinePoweroff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-sm">{t('logout')}</span>
            </Button>
          </div>
        </header>

        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-200 ease-in-out border-b border-border bg-card',
            isOpen
              ? 'max-h-[500px] opacity-100'
              : 'max-h-0 opacity-0 border-b-0'
          )}
        >
          <MobileNav />
        </div>

        {children}

        {openProducts && <Products isTopBar open={openProducts} onOpenChange={setOpenProducts} />}
        {openReceipt && <Receipt isTopBar open={openReceipt} onOpenChange={setOpenReceipt} />}
        {openAllBills && <AllReceiptBills isTopBar open={openAllBills} onOpenChange={setOpenAllBills} />}
        {openCustomers && <CustomersList open={openCustomers} onOpenChange={setOpenCustomers} initialType={customersType} />}
        {openNewTransfer && <TransactionModal isOpen={openNewTransfer} onClose={() => setOpenNewTransfer(false)} />}
        {openTransactions && <TransactionsList open={openTransactions} onOpenChange={setOpenTransactions} />}
        {openWarehouses && <Warehouses isTopBar open={openWarehouses} onOpenChange={setOpenWarehouses} />}
        {openRoles && <Roles isTopBar open={openRoles} onOpenChange={setOpenRoles} />}
        {openUsers && <UsersModule isTopBar open={openUsers} onOpenChange={setOpenUsers} />}
        {openAuditLogs && <AuditLogs isTopBar open={openAuditLogs} onOpenChange={setOpenAuditLogs} />}
        {openCharges && <Charges isTopBar open={openCharges} onOpenChange={setOpenCharges} />}
        {openInvoice && <Invoice isTopBar open={openInvoice} onOpenChange={setOpenInvoice} />}
        {openAllInvoices && <AllInvoices isTopBar open={openAllInvoices} onOpenChange={setOpenAllInvoices} />}
        <SettingsDrawer isOpen={openSettings} onClose={() => setOpenSettings(false)} />
        <ConnectionDrawer isOpen={openConnection} onClose={() => setOpenConnection(false)} />
      </div>
    </ModalContext.Provider>
  )
}

const MobileNav = () => {
  const actions = useContext(ModalContext)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  return (
    <nav className="p-3 flex flex-col gap-1 md:hidden">
      {NAV_ITEMS.map((item) => {
        if (!item.children) {
          return (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex items-center px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              {t(item.label)}
            </a>
          )
        }

        const isExpanded = expandedSection === item.label

        return (
          <div key={item.label}>
            <button
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              onClick={() => setExpandedSection((prev) => (prev === item.label ? null : item.label))}
            >
              {t(item.label)}
              <AiOutlineDown
                className={cn(
                  'w-3.5 h-3.5 opacity-50 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out',
                isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="pl-4 py-1 flex flex-col">
                {item.children.map((child) => (
                  <button
                    key={child.label}
                    onClick={() => child.action(actions)}
                    className="text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    {t(child.label)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

export default AppTopBar
