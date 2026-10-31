import { TooltipProvider } from '@/components/ui/tooltip'
import { DemoPage } from '@/pages/DemoPage'

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <DemoPage />
    </TooltipProvider>
  )
}
