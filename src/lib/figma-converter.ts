// Function to extract Figma file ID from URL
export function extractFigmaFileId(url: string): string | null {
  // Figma URLs typically look like:
  // https://www.figma.com/file/{fileId}/{fileName}
  // https://www.figma.com/design/{fileId}/{fileName}
  const match = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/)
  return match ? match[2] : null
}

// Convert Figma color to CSS rgba
function figmaColorToCSS(color: any, opacity = 1): string {
  if (!color) return 'transparent'
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  const a = (color.a ?? 1) * opacity
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// Convert Figma gradient to CSS
function figmaGradientToCSS(fill: any): string {
  if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
    const stops = fill.gradientStops
      .map((stop: any) => {
        const color = figmaColorToCSS(stop.color)
        const position = Math.round(stop.position * 100)
        return `${color} ${position}%`
      })
      .join(', ')
    
    // Calculate angle from gradient handles
    const handles = fill.gradientHandlePositions
    if (handles && handles.length >= 2) {
      const dx = handles[1].x - handles[0].x
      const dy = handles[1].y - handles[0].y
      const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90)
      return `linear-gradient(${angle}deg, ${stops})`
    }
    return `linear-gradient(180deg, ${stops})`
  }
  return 'transparent'
}

// Convert Figma node to HTML/CSS with proper parent-relative positioning
function figmaNodeToHTML(
  node: any, 
  depth = 0, 
  parentBox: any = null,
  parentHasLayout = false
): { html: string; css: string } {
  let html = ''
  let css = ''
  
  const className = `figma-${node.id.replace(/[^a-zA-Z0-9]/g, '-')}`
  const indent = '  '.repeat(depth)
  
  // Generate CSS for this node
  let nodeCSS = `.${className} {\n`
  
  const hasAutoLayout = !!node.layoutMode
  const isRootFrame = depth === 0
  
  // Position and size
  if (node.absoluteBoundingBox) {
    const box = node.absoluteBoundingBox
    
    // Root frame or non-auto-layout parent: use relative positioning
    if (isRootFrame) {
      nodeCSS += `  position: relative;\n`
      nodeCSS += `  width: ${box.width}px;\n`
      nodeCSS += `  height: ${box.height}px;\n`
      nodeCSS += `  margin: 20px auto;\n`
    } else if (parentHasLayout) {
      // Inside auto-layout parent: don't use absolute positioning
      // Let flexbox handle it, but set explicit size if needed
      
      // For TEXT nodes, let them fill the container width
      if (node.type === 'TEXT') {
        nodeCSS += `  flex: 1;\n`
        nodeCSS += `  min-width: 0;\n` // Allow text to shrink
      } else if (!hasAutoLayout) {
        // Non-text, non-auto-layout children get fixed size
        nodeCSS += `  width: ${box.width}px;\n`
        nodeCSS += `  height: ${box.height}px;\n`
      }
      
      if (node.layoutSizingHorizontal === 'FILL') {
        nodeCSS += `  flex-grow: 1;\n`
        nodeCSS += `  width: 100%;\n`
      }
      if (node.layoutSizingVertical === 'FILL') {
        nodeCSS += `  flex-grow: 1;\n`
      }
      if (node.layoutAlign === 'STRETCH') {
        nodeCSS += `  align-self: stretch;\n`
      }
    } else if (parentBox) {
      // Child with non-auto-layout parent: use absolute positioning relative to parent
      const relativeX = box.x - parentBox.x
      const relativeY = box.y - parentBox.y
      nodeCSS += `  position: absolute;\n`
      nodeCSS += `  left: ${relativeX}px;\n`
      nodeCSS += `  top: ${relativeY}px;\n`
      nodeCSS += `  width: ${box.width}px;\n`
      nodeCSS += `  height: ${box.height}px;\n`
    }
  }
  
  // Background/fills (but NOT for TEXT nodes - their fills are text color)
  if (node.type !== 'TEXT') {
    if (node.fills && node.fills.length > 0 && node.fills[0].visible !== false) {
      const fill = node.fills[0]
      if (fill.type === 'SOLID') {
        const opacity = fill.opacity ?? 1
        nodeCSS += `  background-color: ${figmaColorToCSS(fill.color, opacity)};\n`
      } else if (fill.type === 'GRADIENT_LINEAR') {
        nodeCSS += `  background: ${figmaGradientToCSS(fill)};\n`
      }
    } else if (node.backgroundColor) {
      nodeCSS += `  background-color: ${figmaColorToCSS(node.backgroundColor)};\n`
    }
  }
  
  // Border radius
  if (node.cornerRadius !== undefined) {
    nodeCSS += `  border-radius: ${node.cornerRadius}px;\n`
  } else if (node.rectangleCornerRadii) {
    const radii = node.rectangleCornerRadii
    nodeCSS += `  border-radius: ${radii[0]}px ${radii[1]}px ${radii[2]}px ${radii[3]}px;\n`
  }
  
  // Strokes/borders
  if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
    const stroke = node.strokes[0]
    const strokeColor = figmaColorToCSS(stroke.color)
    const align = node.strokeAlign || 'INSIDE'
    if (align === 'CENTER') {
      nodeCSS += `  border: ${node.strokeWeight}px solid ${strokeColor};\n`
    } else {
      // Simulate INSIDE stroke with box-shadow for better accuracy
      nodeCSS += `  box-shadow: inset 0 0 0 ${node.strokeWeight}px ${strokeColor};\n`
    }
  }
  
  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    nodeCSS += `  opacity: ${node.opacity};\n`
  }
  
  // Text styles
  if (node.type === 'TEXT' && node.style) {
    const style = node.style
    nodeCSS += `  font-family: '${style.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n`
    nodeCSS += `  font-size: ${style.fontSize}px;\n`
    nodeCSS += `  font-weight: ${style.fontWeight};\n`
    nodeCSS += `  color: ${figmaColorToCSS(node.fills?.[0]?.color)};\n`
    nodeCSS += `  text-align: ${style.textAlignHorizontal?.toLowerCase() || 'left'};\n`
    if (style.letterSpacing) {
      nodeCSS += `  letter-spacing: ${style.letterSpacing}px;\n`
    }
    if (style.lineHeightPx) {
      nodeCSS += `  line-height: ${style.lineHeightPx}px;\n`
    }
    // Prevent wrapping for single-line text
    const hasLineBreaks = node.characters && node.characters.includes('\n')
    if (hasLineBreaks) {
      nodeCSS += `  white-space: pre-wrap;\n`
    } else {
      nodeCSS += `  white-space: nowrap;\n`
    }
    // Add flexbox for proper vertical centering
    nodeCSS += `  display: flex;\n`
    nodeCSS += `  align-items: center;\n`
    nodeCSS += `  justify-content: ${style.textAlignHorizontal === 'CENTER' ? 'center' : (style.textAlignHorizontal === 'RIGHT' ? 'flex-end' : 'flex-start')};\n`
  }
  
  // Clip content
  if (node.clipsContent) {
    nodeCSS += `  overflow: hidden;\n`
  }
  
  // Effects (blur, shadows)
  if (node.effects && node.effects.length > 0) {
    const effects = node.effects.filter((e: any) => e.visible !== false)
    for (const effect of effects) {
      if (effect.type === 'BACKGROUND_BLUR') {
        nodeCSS += `  backdrop-filter: blur(${effect.radius}px);\n`
        nodeCSS += `  -webkit-backdrop-filter: blur(${effect.radius}px);\n`
      } else if (effect.type === 'DROP_SHADOW') {
        const shadowColor = figmaColorToCSS(effect.color)
        nodeCSS += `  box-shadow: ${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius || 0}px ${shadowColor};\n`
      }
    }
  }
  
  // Layout (flexbox)
  if (hasAutoLayout) {
    nodeCSS += `  display: flex;\n`
    nodeCSS += `  flex-direction: ${node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'};\n`
    
    if (node.counterAxisAlignItems) {
      const alignMap: Record<string, string> = {
        'MIN': 'flex-start',
        'CENTER': 'center',
        'MAX': 'flex-end',
        'STRETCH': 'stretch'
      }
      nodeCSS += `  align-items: ${alignMap[node.counterAxisAlignItems] || 'flex-start'};\n`
    }
    
    if (node.primaryAxisAlignItems) {
      const justifyMap: Record<string, string> = {
        'MIN': 'flex-start',
        'CENTER': 'center',
        'MAX': 'flex-end',
        'SPACE_BETWEEN': 'space-between'
      }
      nodeCSS += `  justify-content: ${justifyMap[node.primaryAxisAlignItems] || 'flex-start'};\n`
    }
    
    if (node.itemSpacing !== undefined && node.itemSpacing > 0) {
      nodeCSS += `  gap: ${node.itemSpacing}px;\n`
    }
    
    const paddingTop = node.paddingTop || 0
    const paddingRight = node.paddingRight || 0
    const paddingBottom = node.paddingBottom || 0
    const paddingLeft = node.paddingLeft || 0
    
    if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
      nodeCSS += `  padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;\n`
    }
  }
  
  // For containers without auto-layout but with children, ensure proper positioning
  if (!hasAutoLayout && node.children && node.children.length > 0 && !isRootFrame) {
    if (!nodeCSS.includes('position: absolute')) {
      nodeCSS += `  position: relative;\n`
    }
  }
  
  // Box sizing
  nodeCSS += `  box-sizing: border-box;\n`
  
  nodeCSS += `}\n\n`
  css += nodeCSS
  
  // Generate HTML
  if (node.type === 'TEXT') {
    html += `${indent}<div class="${className}">${node.characters || ''}</div>\n`
  } else if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
    html += `${indent}<div class="${className}">\n`
    
    // Process children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childResult = figmaNodeToHTML(
          child, 
          depth + 1, 
          node.absoluteBoundingBox,
          hasAutoLayout
        )
        html += childResult.html
        css += childResult.css
      }
    }
    
    html += `${indent}</div>\n`
  } else if (node.children && node.children.length > 0) {
    // Generic container
    html += `${indent}<div class="${className}">\n`
    for (const child of node.children) {
      const childResult = figmaNodeToHTML(
        child, 
        depth + 1, 
        node.absoluteBoundingBox,
        hasAutoLayout
      )
      html += childResult.html
      css += childResult.css
    }
    html += `${indent}</div>\n`
  }
  
  return { html, css }
}

// Convert entire Figma document to HTML
export function convertFigmaToHTML(figmaData: any): string {
  let allHTML = ''
  let allCSS = ''
  
  // Find the first frame in the document
  if (figmaData.document && figmaData.document.children) {
    for (const canvas of figmaData.document.children) {
      if (canvas.children && canvas.children.length > 0) {
        for (const frame of canvas.children) {
          const result = figmaNodeToHTML(frame)
          allHTML += result.html
          allCSS += result.css
        }
      }
    }
  }
  
  // Create complete HTML document
  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${figmaData.name || 'Figma Design'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    #root {
      position: relative;
      margin: 0 auto;
    }
    
${allCSS}
  </style>
</head>
<body>
  <div id="root">
${allHTML}
  </div>
</body>
</html>`
  
  return htmlDoc
}

// Download HTML file
export function downloadHTMLFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

