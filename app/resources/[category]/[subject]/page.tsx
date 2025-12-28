// app/resources/[category]/[subject]/page.tsx
'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from '@/components/Header'

import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ChevronRight, FileText, ChevronDown, Download, ExternalLink, Loader2, AlertCircle, Search, ArrowUpDown, Filter, RefreshCw, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getResourceTypeForCategory } from '@/lib/resource-utils'
import { useProfile, type Subject } from '@/lib/enhanced-profile-context'
import { getSubjectDisplayByCode } from '@/lib/subject-display'
import { Resource } from '@/lib/types'
import { useResources, useSubjects, useDynamicData } from '@/hooks/use-academic-data'

const CATEGORY_TITLES: Record<string, string> = {
  notes: 'Notes',
  assignments: 'Assignments',
  papers: 'Papers',
  records: 'Records',
}

export default function SubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; subject: string }>
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const unwrappedParams = use(params)
  const { category } = unwrappedParams
  const { profile } = useProfile()

  // Resolve Context Params
  const qpYear = Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year
  const qpBranch = Array.isArray(searchParams.branch) ? searchParams.branch[0] : searchParams.branch
  const qpSemester = Array.isArray(searchParams.semester) ? searchParams.semester[0] : searchParams.semester

  const year = qpYear || profile?.year
  const branch = qpBranch || profile?.branch
  const semester = qpSemester || profile?.semester

  let decodedSubject = ''
  try {
    decodedSubject = decodeURIComponent(unwrappedParams.subject)
  } catch {
    decodedSubject = ''
  }

  // --- Data Fetching ---

  // 1. Dynamic Data (User Count)
  const { data: dynamicData } = useDynamicData({
    branch: profile?.branch,
    year: profile?.year
  })
  const usersCount = dynamicData?.usersCount || 0

  // 2. Subjects (For Display Name)
  const resourceType = getResourceTypeForCategory(category)
  const { data: subjectsData } = useSubjects({
    year,
    branch,
    semester,
    resourceType: resourceType || undefined,
    enabled: !!year && !!branch && !!semester
  })
  const subjects = subjectsData?.subjects || []

  // 3. Resources
  const { 
    data: resourcesData, 
    isLoading: loading, 
    error: resourcesError, 
    refetch 
  } = useResources({
    category,
    subject: decodedSubject,
    year,
    branch,
    semester,
    enabled: !!decodedSubject
  })
  
  const resources = resourcesData || []
  const error = resourcesError ? (resourcesError as Error).message : null

  // --- UI State ---
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set())
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc')
  const [query, setQuery] = useState<string>('')
  const [expandAll, setExpandAll] = useState<boolean>(false)

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'student':
        return <Badge variant="secondary">Student</Badge>
      case 'representative':
        return <Badge variant="default">Representative</Badge>
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>
      case 'yeshh':
        return <Badge variant="destructive">Yeshh</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // Compute subject display name using fetched subjects
  const subjectName = useMemo(() => {
    if (!decodedSubject) return ''
    // Cast strict type to compatible type for helper
    return getSubjectDisplayByCode(subjects as Subject[], decodedSubject, true)
  }, [subjects, decodedSubject])

  const categoryTitle = CATEGORY_TITLES[category]

  if (!categoryTitle || !decodedSubject) {
    notFound()
  }

  // Types available across resources
  const availableTypes = useMemo(() => {
    const set = new Set<string>()
    resources.forEach(r => {
      if (r.type || r.file_type) set.add(r.type || r.file_type)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [resources])

  // Derived, filtered, and sorted resources
  const visibleResources = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = resources.filter(r => {
      const matchesType = selectedType === 'all' || (r.type || r.file_type) === selectedType
      const matchesText =
        term.length === 0 ||
        (r.name || r.title).toLowerCase().includes(term) ||
        (r.description ? r.description.toLowerCase().includes(term) : false)
      const matchesUnit = selectedUnit === 'all' || (r.unit || 1) === parseInt(selectedUnit)
      return matchesType && matchesText && matchesUnit
    })
    const parseDate = (d: string | undefined) => {
      const t = d ? Date.parse(d) : 0
      return Number.isNaN(t) ? 0 : t
    }
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.date || a.created_at
      const dateB = b.date || b.created_at
      if (sortBy === 'name_asc') return (a.name || a.title).localeCompare(b.name || b.title)
      if (sortBy === 'date_asc') return parseDate(dateA) - parseDate(dateB)
      return parseDate(dateB) - parseDate(dateA) // date_desc
    })
    return sorted
  }, [resources, selectedType, query, selectedUnit, sortBy])

  // Group resources by unit
  const resourcesByUnit = useMemo(() => {
    const grouped: Record<number, Resource[]> = {}
    visibleResources.forEach(resource => {
      const unit = resource.unit || 1
      if (!grouped[unit]) grouped[unit] = []
      grouped[unit].push(resource)
    })
    return grouped
  }, [visibleResources])

  const units = useMemo(
    () => Object.keys(resourcesByUnit).map(Number).sort((a, b) => a - b),
    [resourcesByUnit]
  )

  // Keep expanded state in sync with "Expand all"
  useEffect(() => {
    if (selectedUnit !== 'all') {
      setExpandAll(false)
      setExpandedUnits(new Set()) 
      return
    }
    if (expandAll) {
      setExpandedUnits(new Set(units))
    } else {
      setExpandedUnits(new Set())
    }
  }, [expandAll, units, selectedUnit])

  // Toggle unit expansion
  const toggleUnit = (unit: number) => {
    const newExpanded = new Set(expandedUnits)
    if (newExpanded.has(unit)) {
      newExpanded.delete(unit)
    } else {
      newExpanded.add(unit)
    }
    setExpandedUnits(newExpanded)
  }

  // Handle file access
  const handleFileAccess = async (resource: Resource, action: 'view' | 'download') => {
    const url = resource.url || resource.drive_link
    if (!url) {
      console.error('Resource has no URL')
      return
    }

    setLoadingFile(resource.id)

    try {
      if (action === 'download') {
        const link = document.createElement('a')
        link.href = url
        link.download = resource.name || resource.title || 'resource'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setLoadingFile(null)
    }
  }

  const resultCount = visibleResources.length

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      <Header />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb items={[
              { label: "Home", href: "/" },
              { label: categoryTitle, href: `/resources/${category}` },
              { label: subjectName || decodedSubject, isCurrentPage: true }
            ]} />
          </div>
          <div className="flex items-center gap-4">
            {profile?.role && getRoleDisplay(profile.role)}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
              <Users className="h-3 w-3 text-primary" />
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">
                  {usersCount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-start justify-center">
            <h1 className="text-3xl font-bold tracking-tight text-center">{subjectName || decodedSubject} {categoryTitle}</h1>
          </div>
          <p className="text-muted-foreground text-center">Access all {subjectName || decodedSubject} {categoryTitle} with quick filters and smart dropdowns</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Available Resources</CardTitle>
          <CardDescription>
            Filter, sort and browse all {subjectName || decodedSubject} {categoryTitle} organized by unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && (
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Select value={selectedUnit} onValueChange={(v) => setSelectedUnit(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit.toString()}>Unit {unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={(v) => setSelectedType(v)}>
                    <SelectTrigger className="w-[160px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {availableTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-[170px]">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        <SelectValue placeholder="Sort by" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest first</SelectItem>
                      <SelectItem value="date_asc">Oldest first</SelectItem>
                      <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-[260px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or description"
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={loading}
                  className="hidden sm:inline-flex"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
                {selectedUnit === 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandAll(prev => !prev)}
                    className="hidden sm:inline-flex"
                  >
                    <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${expandAll ? 'rotate-180' : ''}`} />
                    {expandAll ? 'Collapse all' : 'Expand all'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {!loading && resultCount > 0 && (
            <p className="mb-2 text-xs text-muted-foreground">
              Showing {resultCount} {resultCount === 1 ? 'item' : 'items'}
            </p>
          )}

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(unit => (
                <div key={unit} className="border rounded-lg p-4">
                  <Skeleton className="h-6 w-32 mb-3" />
                  <div className="space-y-3">
                    {[1, 2, 3].map(file => (
                      <div key={file} className="flex items-center justify-between">
                        <Skeleton className="h-5 w-48" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && units.length > 0 && (
            <div className="space-y-4">
              {selectedUnit === 'all' ? (
                units.map(unit => (
                  <div key={unit} className="border rounded-lg bg-muted/30">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto"
                      onClick={() => toggleUnit(unit)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Unit {unit}</span>
                        <Badge variant="secondary" className="rounded-full">{resourcesByUnit[unit].length}</Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedUnits.has(unit) ? 'rotate-180' : ''}`} />
                    </Button>

                    {expandedUnits.has(unit) && (
                      <div className="px-4 pb-4 space-y-3">
                        {resourcesByUnit[unit].map((resource, index) => (
                          <div
                            key={resource.id || `${resource.name || resource.title}-${index}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-background rounded-md border"
                          >
                            <div className="flex items-start gap-3 mb-2 sm:mb-0">
                              <FileText className="h-4 w-4 mt-0.5 text-primary" />
                              <div>
                                <h4 className="font-medium text-sm">{resource.name || resource.title}</h4>
                                {resource.description && (
                                  <p className="text-xs text-muted-foreground">{resource.description}</p>
                                )}
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{resource.type || resource.file_type}</Badge>
                                  <span className="text-xs text-muted-foreground">{resource.date || resource.created_at}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(resource.id || resource.url || resource.drive_link) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => handleFileAccess(resource, 'download')}
                                    disabled={loadingFile === resource.id}
                                  >
                                    {loadingFile === resource.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <Download className="mr-1 h-3 w-3" />
                                    )}
                                    {loadingFile === resource.id ? 'Downloading...' : 'Download'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => handleFileAccess(resource, 'view')}
                                    disabled={loadingFile === resource.id}
                                  >
                                    {loadingFile === resource.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <ExternalLink className="mr-1 h-3 w-3" />
                                    )}
                                    {loadingFile === resource.id ? 'Opening...' : 'View'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Unit {selectedUnit}</h3>
                    <Badge variant="secondary" className="rounded-full">
                      {resourcesByUnit[parseInt(selectedUnit)]?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {resourcesByUnit[parseInt(selectedUnit)]?.map((resource, index) => (
                      <div
                        key={resource.id || `${resource.name || resource.title}-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-background rounded-md border"
                      >
                        <div className="flex items-start gap-3 mb-2 sm:mb-0">
                          <FileText className="h-4 w-4 mt-0.5 text-primary" />
                          <div>
                            <h4 className="font-medium text-sm">{resource.name || resource.title}</h4>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground">{resource.description}</p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">{resource.type || resource.file_type}</Badge>
                              <span className="text-xs text-muted-foreground">{resource.date || resource.created_at}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(resource.id || resource.url || resource.drive_link) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleFileAccess(resource, 'download')}
                              >
                                <Download className="mr-1 h-3 w-3" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleFileAccess(resource, 'view')}
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                View
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && units.length === 0 && (
            <div className="rounded-lg border p-6 text-center">
              <p className="text-muted-foreground">No resources match the current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
