export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
}

/**
 * Generates breadcrumb items from a context
 * @param regulation - e.g. 'r23'
 * @param branch - e.g. 'cse'
 * @param yearSem - e.g. '31'
 * @param category - e.g. 'notes' (optional)
 * @param subject - e.g. 'res' (optional)
 * @param subjectDisplayName - optional display name for the subject
 */
export function generateBreadcrumbs(
  regulation: string,
  branch: string,
  yearSem: string,
  category?: string,
  subject?: string,
  subjectDisplayName?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = []
  const baseUrl = `/${regulation}/${branch}/${yearSem}`

  // Always start with "Home" pointing to the context dashboard
  items.push({ label: 'Home', href: baseUrl })

  if (category) {
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)
    if (subject) {
      items.push({ 
        label: categoryLabel, 
        href: `${baseUrl}/${category.toLowerCase()}` 
      })
      items.push({ 
        label: subjectDisplayName || subject.toUpperCase(), 
        isCurrentPage: true 
      })
    } else {
      items.push({ 
        label: categoryLabel, 
        isCurrentPage: true 
      })
    }
  } else {
    items[0].isCurrentPage = true
    delete items[0].href
  }

  return items
}
