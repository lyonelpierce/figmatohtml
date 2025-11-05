import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Download } from 'lucide-react'

interface PreviewTabsProps {
  apiResponse: any
  convertFigmaToHTML: (data: any) => string
  downloadHTMLFile: (content: string, filename: string) => void
}

export function PreviewTabs({ apiResponse, convertFigmaToHTML, downloadHTMLFile }: PreviewTabsProps) {
  if (apiResponse.error) {
    return (
      <div className="w-4/6 bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="bg-red-950 border border-red-500 rounded p-4">
          <p className="text-red-400">{apiResponse.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-4/6 bg-slate-800 rounded-lg border border-slate-700 p-6">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">HTML/CSS</TabsTrigger>
          <TabsTrigger value="api">API Response</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-0">
          <div className="bg-white rounded overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
            <iframe
              srcDoc={convertFigmaToHTML(apiResponse)}
              title="HTML Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="code" className="mt-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Generated HTML/CSS</h3>
            <Button
              onClick={() => {
                const html = convertFigmaToHTML(apiResponse)
                const filename = `${apiResponse.name?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'figma-design'}.html`
                downloadHTMLFile(html, filename)
              }}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download HTML/CSS
            </Button>
          </div>
          <div className="bg-slate-950 rounded p-4 overflow-auto" style={{ height: 'calc(100vh - 340px)' }}>
            <pre className="text-sm text-slate-300">
              {convertFigmaToHTML(apiResponse)}
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="api" className="mt-0">
          <h3 className="text-lg font-semibold text-white mb-4">Figma API Response</h3>
          <div className="bg-slate-950 rounded p-4 overflow-auto" style={{ height: 'calc(100vh - 340px)' }}>
            <pre className="text-sm text-slate-300">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

