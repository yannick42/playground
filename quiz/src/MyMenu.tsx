import { Popover, PopoverButton, PopoverPanel, PopoverOverlay } from '@headlessui/react'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'
import {
  ArrowPathIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  ArchiveBoxIcon,
  GlobeEuropeAfricaIcon,
} from '@heroicons/react/24/outline'

const triviaDecks = [
  { name: 'History', description: 'World history, ...', href: '#', icon: ArchiveBoxIcon },
  { name: 'Geography', description: 'Geography questions ...', href: '#', icon: GlobeEuropeAfricaIcon },
]
const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Contact sales', href: '#', icon: PhoneIcon },
]

export function MyMenu({ sendName }) {

  return (
    <Popover className="relative">
        <PopoverButton className="inline-flex m-1 items-center gap-x-1 text-sm/6 font-semibold text-gray-900"
            onClick={() => close()}>
            <span>Decks</span>
            <ChevronDownIcon aria-hidden="true" className="size-5" />
        </PopoverButton>
    
      <PopoverOverlay className="fixed inset-0 bg-black opacity-30" />

      <PopoverPanel
        transition
        className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2
                    px-4 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200
                    data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
      >
        {({ close }) => (
        <div className="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm/6 ring-1
                        shadow-lg ring-gray-900/5">
          <div className="p-4">
            {triviaDecks.map((item) => (
              <div key={item.name} onClick={() => { sendName(item.name); close(); }} className="group relative flex
                gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50
                    group-hover:bg-white">
                  <item.icon aria-hidden="true" className="size-6 text-gray-600 group-hover:text-indigo-600" />
                </div>
                <div>
                  <a href={item.href} className="font-semibold text-gray-900">
                    {item.name}
                    <span className="absolute inset-0" />
                  </a>
                  <p className="mt-1 text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50">
            {callsToAction.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900
                    hover:bg-gray-100"
              >
                <item.icon aria-hidden="true" className="size-5 flex-none text-gray-400" />
                {item.name}
              </a>
            ))}
          </div> */}
        </div>
        )}
      </PopoverPanel>
    </Popover>
  )
}