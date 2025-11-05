import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface FormField {
  state: {
    value: string
  }
  handleChange: (value: string) => void
}

interface FigmaFormProps {
  onSubmit: (e: React.FormEvent) => void
  figmaUrlField: FormField
  apiKeyField: FormField
  isPending: boolean
  extractFigmaFileId: (url: string) => string | null
}

export function FigmaForm({ 
  onSubmit, 
  figmaUrlField, 
  apiKeyField, 
  isPending,
  extractFigmaFileId 
}: FigmaFormProps) {
  return (
    <div className="w-2/6 h-min bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="figmaUrl" className="text-white">
              Figma URL
            </Label>
            <Input
              id="figmaUrl"
              type="text"
              placeholder="https://www.figma.com/file/xZUVUSgTiRtnflAt3Tq6Bk/..."
              value={figmaUrlField.state.value}
              onChange={(e) => figmaUrlField.handleChange(e.target.value)}
              className="mt-1 text-white"
            />
            {figmaUrlField.state.value && extractFigmaFileId(figmaUrlField.state.value) && (
              <p className="text-sm text-cyan-400 mt-1">
                File ID: {extractFigmaFileId(figmaUrlField.state.value)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="apiKey" className="text-white">
              Figma API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Figma API key"
              value={apiKeyField.state.value}
              onChange={(e) => apiKeyField.handleChange(e.target.value)}
              className="mt-1 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              Get your API key from Figma Settings → Personal Access Tokens
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isPending}
          >
            {isPending ? 'Fetching...' : 'Fetch Figma File'}
          </Button>
        </div>
      </form>
    </div>
  )
}

