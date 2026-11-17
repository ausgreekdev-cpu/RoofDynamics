'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { BLOG_POSTS } from './blog'

export function Blog() {
  const [slug, setSlug] = useState<string | null>(null)
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (post) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{post.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSlug(null)}>Back</Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">{post.date} · {post.suburb}</p>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed markdown-body">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {BLOG_POSTS.map((p) => (
        <Card key={p.slug} className="cursor-pointer hover:border-[var(--primary)] transition" onClick={() => setSlug(p.slug)}>
          <CardHeader>
            <CardTitle className="text-base">{p.title}</CardTitle>
            <Badge variant="secondary">{p.suburb}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--muted-foreground)]">{p.excerpt}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-2">{p.date}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

