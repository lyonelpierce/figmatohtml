import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { FigmaForm } from '../components/figma-form'
import { LoadingState } from '../components/loading-state'
import { EmptyState } from '../components/empty-state'
import { PreviewTabs } from '../components/preview-tabs'
import { extractFigmaFileId, convertFigmaToHTML, downloadHTMLFile } from '../lib/figma-converter'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [apiResponse, setApiResponse] = useState<any>(null)

  // Mutation for fetching Figma file data
  const figmaMutation = useMutation({
    mutationFn: async ({ fileId, apiKey }: { fileId: string; apiKey: string }) => {
      const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
        headers: {
          'X-Figma-Token': apiKey,
        },
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      setApiResponse(data)
    },
    onError: (error: Error) => {
      setApiResponse({ error: error.message })
    },
  })

  const form = useForm({
    defaultValues: {
      figmaUrl: '',
      apiKey: '',
    },
    onSubmit: async ({ value }) => {
      const fileId = extractFigmaFileId(value.figmaUrl)
      
      if (!fileId) {
        setApiResponse({ error: 'Invalid Figma URL. Please enter a valid Figma file URL.' })
        return
      }

      if (!value.apiKey) {
        setApiResponse({ error: 'Please enter your Figma API key.' })
        return
      }

      figmaMutation.mutate({ fileId, apiKey: value.apiKey })
    },
  })

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto flex gap-4">
        <form.Field name="figmaUrl">
          {(figmaUrlField) => (
            <form.Field name="apiKey">
              {(apiKeyField) => (
                <FigmaForm
                  onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                  }}
                  figmaUrlField={figmaUrlField}
                  apiKeyField={apiKeyField}
                  isPending={figmaMutation.isPending}
                  extractFigmaFileId={extractFigmaFileId}
                />
              )}
            </form.Field>
          )}
        </form.Field>

        {figmaMutation.isPending ? (
          <LoadingState />
        ) : apiResponse ? (
          <PreviewTabs
            apiResponse={apiResponse}
            convertFigmaToHTML={convertFigmaToHTML}
            downloadHTMLFile={downloadHTMLFile}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}
