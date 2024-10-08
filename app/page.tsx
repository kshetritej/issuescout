'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Repo = {
  repo: string
  count: number
  url: string
}

const ITEMS_PER_PAGE = 10

const trendingTopics = [
  'hacktoberfest',
  'good-first-issue',
  'help-wanted',
  'bug',
  'enhancement',
  'documentation'
]

export default function GitHubIssueFinder() {
  const [tags, setTags] = useState('')
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchIssuesByTags = async (tags: string) => {
    setLoading(true)
    setError(null)

    try {
      const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean)
      const queryString = tagList.map(tag => `label:${tag}`).join('+')
      const response = await fetch(`https://api.github.com/search/issues?q=${queryString}&per_page=100`)
      if (!response.ok) {
        throw new Error('Failed to fetch issues')
      }
      const data = await response.json()
      
      const repoIssueCount: Record<string, { count: number; url: string }> = {}

      data.items.forEach((issue: any) => {
        const repoFullName = issue.repository_url.split('/').slice(-2).join('/')
        if (!repoIssueCount[repoFullName]) {
          repoIssueCount[repoFullName] = { 
            count: 0, 
            url: issue.repository_url.replace('api.github.com/repos', 'github.com')
          }
        }
        repoIssueCount[repoFullName].count++
      })

      const sortedRepos = Object.entries(repoIssueCount)
        .map(([repo, { count, url }]) => ({ repo, count, url }))
        .sort((a, b) => b.count - a.count)

      setRepos(sortedRepos)
    } catch (err) {
      setError('An error occurred while fetching issues. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tags) {
      fetchIssuesByTags(tags)
    }
  }, [tags])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchIssuesByTags(tags)
    setCurrentPage(1)
  }

  const handleTrendingTopicClick = (topic: string) => {
    setTags(prevTags => {
      const newTags = prevTags ? `${prevTags},${topic}` : topic
      return newTags
    })
  }

  const totalPages = Math.ceil(repos.length / ITEMS_PER_PAGE)
  const paginatedRepos = repos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-center">GitHub Issue Finder</CardTitle>
            <CardDescription className="text-center text-lg">Search for GitHub issues by multiple labels</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col space-y-4 mb-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter labels separated by commas (e.g., hacktoberfest, good-first-issue)"
                  className="flex-grow text-lg py-6"
                  aria-label="Enter labels"
                />
                <Button type="submit" disabled={loading} className="text-lg py-6">
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              {tags && (
                <div className="flex flex-wrap gap-2">
                  {tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag.trim()}</Badge>
                  ))}
                </div>
              )}
            </form>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Trending Topics:</h3>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleTrendingTopicClick(topic)}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 mb-4" role="alert">{error}</p>}

            {repos.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Issue Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRepos.map((repo) => (
                    <TableRow key={repo.repo}>
                      <TableCell>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {repo.repo}
                        </a>
                      </TableCell>
                      <TableCell>{repo.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {repos.length > ITEMS_PER_PAGE && (
            <CardFooter className="flex justify-between">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  )
}